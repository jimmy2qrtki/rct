from django.shortcuts import render, get_object_or_404, redirect
from .models import Address, EventAddress, Project, Event, RequestCounter
from .forms import ProjectForm, EventForm
from django.contrib.auth.decorators import login_required
from openpyxl import load_workbook
import requests, json
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST, require_http_methods
from django.utils.html import escape
from .utils import reset_request_counter, get_time_until_midnight
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User, Group

@login_required
def manage_projects(request):
    projects = Project.objects.filter(user=request.user)
    projects_with_events = [(project, project.get_next_event()) for project in projects]
    return render(request, 'projects/manage_projects.html', {'projects_with_events': projects_with_events})

@login_required
def edit_project(request, project_id):
    # Получаем проект
    project = get_object_or_404(Project, pk=project_id)
    
    # Получаем связанные события и адреса
    events = project.events.all()
    addresses = project.addresses.all()
    
    # Получаем или создаем RequestCounter для текущего пользователя
    counter, created = RequestCounter.objects.get_or_create(user=request.user)
    remaining_requests = counter.count
    
    # Обработка формы
    if request.method == 'POST':
        form = ProjectForm(request.POST, request.FILES, instance=project)
        if form.is_valid():
            form.save()
            return redirect('edit_project', project_id=project.id)  # Перенаправление для предотвращения повторной отправки формы
    else:
        form = ProjectForm(instance=project)

    # Отправляем данные в шаблон
    return render(request, 'projects/edit_project.html', {
        'form': form,
        'project': project,
        'events': events,
        'addresses': addresses,
        'remaining_requests': remaining_requests,  # Отображаем оставшиеся запросы
    })

@login_required
def create_project(request):
    if request.method == 'POST':
        form = ProjectForm(request.POST, request.FILES)
        if form.is_valid():
            project = form.save(commit=False)
            project.user = request.user
            form.save()
            return redirect('edit_project', project_id=project.id)
    else:
        form = ProjectForm()
    return render(request, 'projects/create_project.html', {'form': form})

def manage_events(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    events = project.events.all()
    return render(request, 'projects/manage_events.html', {'project': project, 'events': events})

def edit_event(request, event_id):
    event = get_object_or_404(Event, pk=event_id)
    project = event.project

    if request.method == 'POST':
        form = EventForm(request.POST, instance=event)
        if form.is_valid():
            form.save()
            return redirect('edit_project', project_id=project.id)
    else:
        form = EventForm(instance=event)

    project_addresses = project.addresses.all()

    # Получаем пользователей, принадлежащих к группе "Исполнитель"
    executor_group = Group.objects.get(name='Исполнитель')
    executors = User.objects.filter(groups=executor_group).prefetch_related('executorprofile')

    return render(request, 'projects/edit_event.html', {
        'form': form,
        'project': project,
        'event': event,
        'project_addresses': project_addresses,
        'executors': executors,  # Передаем исполнителей в шаблон
    })

def copy_addresses(request, event_id):
    event = get_object_or_404(Event, id=event_id)

    # Удаляем все существующие адреса для события
    event.addresses.all().delete()

    # Получаем адреса из проекта
    project_addresses = event.project.addresses.all()

    # Копируем адреса из проекта в событие
    for addr in project_addresses:
        EventAddress.objects.create(
            event=event,
            name=addr.name,
            latitude=addr.latitude,
            longitude=addr.longitude,
        )

    # Подготавливаем данные для возврата через JSON
    event_addresses = list(event.addresses.values('name', 'latitude', 'longitude'))
    return JsonResponse({"message": "Addresses copied successfully", "addresses": event_addresses})

def create_event(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    if request.method == 'POST':
        form = EventForm(request.POST)
        if form.is_valid():
            event = form.save(commit=False)
            event.project = project
            event.save()
            return redirect('edit_project', project_id=project_id)
    else:
        form = EventForm()
    return render(request, 'projects/create_event.html', {'form': form, 'project': project})

def delete_project(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    project.delete()
    return redirect('manage_projects')

def delete_event(request, event_id):
    event = get_object_or_404(Event, pk=event_id)
    project_id = event.project.id
    event.delete()
    return redirect('edit_project', project_id=project_id)

def get_coordinates_from_yandex(address):
    # Выполняем запрос к Yandex Geocoding API (вставьте свой API ключ)
    response = requests.get("https://geocode-maps.yandex.ru/1.x/", params={
        'apikey': '212ad00a-2b33-4742-9805-36eb9352e2df',
        'geocode': address,
        'format': 'json',
    })
    geo_object = response.json()['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']
    coordinates = geo_object['Point']['pos'].split()
    return {
        'lat': float(coordinates[1]),
        'lon': float(coordinates[0]),
    }

@login_required
def get_coordinates(request, project_id):
    reset_request_counter(request)  # Передайте request для доступа к пользователю
    counter = RequestCounter.objects.get(user=request.user)

    if counter.count <= 0:
        time_left = get_time_until_midnight()
        return JsonResponse({
            'status': 'error',
            'message': f'Закончились запросы для координат - запросы будут доступны через {time_left}',
            'remaining_requests': counter.count
        })
    
    if request.method == 'POST' and request.FILES.get('excel_file'):
        project = get_object_or_404(Project, pk=project_id)
        uploaded_file = request.FILES['excel_file']
        workbook = load_workbook(uploaded_file, data_only=True)
        sheet = workbook.active
        addresses_list = []

        try:
            num_processed = 0

            for index, row in enumerate(sheet.iter_rows(min_row=2, max_col=1, values_only=True)):
                if row[0]:
                    if counter.count <= 0:
                        time_left = get_time_until_midnight()
                        return JsonResponse({
                            'status': 'error',
                            'message': f'Закончились запросы для координат - запросы будут доступны через {time_left}',
                            'remaining_requests': counter.count
                        })
                    
                    coordinates = get_coordinates_from_yandex(row[0])
                    address = Address.objects.create(
                        project=project,
                        name=row[0],
                        latitude=coordinates['lat'],
                        longitude=coordinates['lon']
                    )
                    html = f"""
                    <li data-id="{address.id}">
                        <span class="address-number">{index + 1}.</span>
                        <input class="address-name" value="{escape(address.name)}" data-id="{address.id}"> |
                        <span class="latitude">{address.latitude}</span> |
                        <span class="longitude">{address.longitude}</span>
                        <button class="delete-address-btn" data-id="{address.id}">Удалить</button>
                    </li>
                    """
                    addresses_list.append(html)
                    num_processed += 1
            
            counter.count -= num_processed
            counter.save()

            return JsonResponse({'status': 'ok', 'addresses': addresses_list, 'remaining_requests': counter.count})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e), 'remaining_requests': counter.count})

    return JsonResponse({'status': 'error', 'message': 'Invalid request'})

@require_POST
def delete_addresses(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    # Удаляем все адреса, связанные с проектом
    project.addresses.all().delete()
    return JsonResponse({'status': 'ok'})

@require_http_methods(["POST"])
def edit_address_name(request, project_id):
    payload = json.loads(request.body)
    address_id = payload.get('id')
    new_name = payload.get('new_name')

    try:
        address = Address.objects.get(id=address_id, project_id=project_id)
        address.name = new_name
        address.save()
        return JsonResponse({'status': 'ok'})
    except Address.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Address not found'}, status=404)

@require_http_methods(["DELETE"])
def delete_address(request, project_id):
    payload = json.loads(request.body)
    address_id = payload.get('id')

    try:
        address = Address.objects.get(id=address_id, project_id=project_id)
        address.delete()
        return JsonResponse({'status': 'ok'})
    except Address.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Address not found'}, status=404)
    
@require_POST
def update_addresses(request, project_id):
    reset_request_counter(request)
    counter = RequestCounter.objects.get(user=request.user)

    if counter.count <= 0:
        time_left = get_time_until_midnight()
        return JsonResponse({
            'status': 'error',
            'message': f'Закончились запросы для координат - запросы будут доступны через {time_left}',
            'remaining_requests': counter.count
        })

    try:
        project = get_object_or_404(Project, pk=project_id)
        data = json.loads(request.body)
        new_addresses = data.get('new_addresses', [])
        num_processed = 0

        for name in new_addresses:
            if name:
                if counter.count <= 0:
                    time_left = get_time_until_midnight()
                    return JsonResponse({
                        'status': 'error',
                        'message': f'Закончились запросы для координат - запросы будут доступны через {time_left}',
                        'remaining_requests': counter.count
                    })

                coordinates = get_coordinates_from_yandex(name)
                Address.objects.create(
                    project=project, 
                    name=name, 
                    latitude=coordinates['lat'], 
                    longitude=coordinates['lon']
                )
                num_processed += 1  # Увеличиваем счетчик обработанных адресов

        counter.count -= num_processed  # Уменьшаем количество запросов на количество обработанных адресов
        counter.save()
        
        return JsonResponse({'status': 'ok', 'remaining_requests': counter.count})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

# удаление адреса из списка адресов в событии      
def delete_event_address(request, address_id):
    if request.method == "POST":
        address = get_object_or_404(EventAddress, id=address_id)
        address.delete()
        return JsonResponse({"success": True})
    else:
        return JsonResponse({"error": "Invalid request"}, status=400)

# сохранение новых адресов в событии    
@csrf_exempt
def add_new_addresses(request, event_id):
    if request.method == 'POST':
        event = get_object_or_404(Event, id=event_id)
        data = json.loads(request.POST.get('addresses', '[]'))
        new_addresses = []
        
        for item in data:
            new_address = EventAddress.objects.create(
                event=event,
                name=item['name'],
                latitude=item['latitude'],
                longitude=item['longitude']
            )
            new_addresses.append(new_address)
        
        # Подготавливаем данные для ответа
        response_data = {
            'addresses': [
                {
                    'id': addr.id, 
                    'name': addr.name, 
                    'latitude': addr.latitude, 
                    'longitude': addr.longitude
                } 
                for addr in event.addresses.all()
            ]
        }
        
        return JsonResponse(response_data)

# обновление порядка адресов в событии
def update_address_order(request):
    if request.method == 'POST':
        order_data = json.loads(request.POST.get('order', '[]'))
        
        for item in order_data:
            address = EventAddress.objects.get(id=item['id'])
            address.order = item['order']
            address.save()

        return JsonResponse({'status': 'success'})

    return JsonResponse({'status': 'failure'}, status=400)

@login_required
# представление списка назначенных событий для исполнителя
def assigned_events_list(request):
    user = request.user
    assigned_events = Event.objects.filter(assigned_user=user)

    context = {
        'assigned_events': assigned_events
    }
    return render(request, 'projects/assigned_events_list.html', context)

@login_required
# представление для удаления назначенного события из списка назначенных событий
def remove_assigned_event(request, event_id):
    event = get_object_or_404(Event, id=event_id, assigned_user=request.user)

    if request.method == 'POST':
        event.assigned_user = None
        event.save()
        return redirect('assigned_events_list')

    return redirect('assigned_events_list')

@csrf_exempt
# сохраняет и динамически обновляет исполнителей события
def update_event_executors(request, event_id):
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        executors_ids = request.POST.getlist('executors[]')
        event = get_object_or_404(Event, pk=event_id)

        # Снять всех текущих исполнителей
        event.assigned_users.clear()

        # Назначить новых исполнителей
        users = User.objects.filter(id__in=executors_ids)
        event.assigned_users.add(*users)

        executors_data = [{'id': user.id,
                           'name': user.executorprofile.name,
                           'district': user.executorprofile.district,
                           'phone_number': user.executorprofile.phone_number}
                          for user in users]

        return JsonResponse({'executors': executors_data})

    return JsonResponse({'error': 'Invalid request'}, status=400)

# Удаляем пользователя из исполнителей события
def remove_executor(request):
    if request.method == 'POST':
        executor_id = request.POST.get('executor_id')
        event_id = request.POST.get('event_id')

        # Получаем событие и пользователя на удаление
        try:
            event = Event.objects.get(id=event_id)
            user = User.objects.get(id=executor_id)
        except (Event.DoesNotExist, User.DoesNotExist):
            return JsonResponse({'error': 'Event or User not found'}, status=404)

        # Удаляем пользователя из исполнителей события
        event.assigned_users.remove(user)

        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Invalid request'}, status=400)