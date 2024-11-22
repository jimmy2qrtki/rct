from django.shortcuts import render, get_object_or_404, redirect
from .models import Project, Event
from .forms import ProjectForm, EventForm
from django.contrib.auth.decorators import login_required

@login_required
def manage_projects(request):
    projects = Project.objects.filter(user=request.user)
    projects_with_events = [(project, project.get_next_event()) for project in projects]
    return render(request, 'projects/manage_projects.html', {'projects_with_events': projects_with_events})

def edit_project(request, project_id):
    project = get_object_or_404(Project, pk=project_id)
    events = project.events.all()

    if request.method == 'POST':
        form = ProjectForm(request.POST, request.FILES, instance=project)
        if form.is_valid():
            form.save()
    else:
        form = ProjectForm(instance=project)
    
    return render(request, 'projects/edit_project.html', {
        'form': form,
        'project': project,
        'events': events
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