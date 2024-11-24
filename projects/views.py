from django.shortcuts import render, get_object_or_404, redirect
from .models import Address, Project, Event, RequestCounter
from .forms import ProjectForm, EventForm
from django.contrib.auth.decorators import login_required
from openpyxl import load_workbook
import requests, json
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.utils.html import escape
from .utils import reset_request_counter, get_time_until_midnight

@login_required
def manage_projects(request):
    projects = Project.objects.filter(user=request.user)
    projects_with_events = [(project, project.get_next_event()) for project in projects]
    return render(request, 'projects/manage_projects.html', {'projects_with_events': projects_with_events})

def edit_project(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    events = project.events.all()
    addresses = project.addresses.all()
    counter, created = RequestCounter.objects.get_or_create(pk=1)
    remaining_requests = counter.count

    if request.method == 'POST':
        form = ProjectForm(request.POST, request.FILES, instance=project)
        if form.is_valid():
            form.save()
            # Без парсинга координат здесь
    else:
        form = ProjectForm(instance=project)
    
    return render(request, 'projects/edit_project.html', {
        'form': form,
        'project': project,
        'events': events,
        'addresses': addresses,
        'remaining_requests': remaining_requests,  # Передаем оставшиеся запросы в шаблон
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
     
     return render(request, 'projects/edit_event.html', {'form': form, 'project': project, 'event': event})

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
    reset_request_counter()
    counter, created = RequestCounter.objects.get_or_create(pk=1)

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
    reset_request_counter()  # Сбрасываем счетчик, если необходимо
    counter, created = RequestCounter.objects.get_or_create(pk=1)

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