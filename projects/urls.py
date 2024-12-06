from django.urls import path
from . import views

urlpatterns = [
    path('', views.manage_projects, name='manage_projects'),
    path('create/', views.create_project, name='create_project'),
    path('<int:project_id>/edit/', views.edit_project, name='edit_project'),
    path('<int:project_id>/events/', views.manage_events, name='manage_events'),
    path('<int:project_id>/events/create/', views.create_event, name='create_event'),
    path('<int:project_id>/delete/', views.delete_project, name='delete_project'),
    path('event/<int:event_id>/edit/', views.edit_event, name='edit_event'),
    path('event/<int:event_id>/delete/', views.delete_event, name='delete_event'),
    path('events/<int:event_id>/copy_addresses/', views.copy_addresses, name='copy_addresses'),
    path('events/address/<int:address_id>/delete/', views.delete_event_address, name='delete_event_address'),
    path('event/<int:event_id>/add_addresses/', views.add_new_addresses, name='add_new_addresses'),
    path('update-address-order/', views.update_address_order, name='update_address_order'), # обновление порядка адреса в списке адресов события
    path('project/<int:project_id>/get_coordinates/', views.get_coordinates, name='get_coordinates'),
    path('project/<int:project_id>/delete_addresses/', views.delete_addresses, name='delete_addresses'),
    path('project/<int:project_id>/edit_address_name/', views.edit_address_name, name='edit_address_name'),
    path('project/<int:project_id>/delete_address/', views.delete_address, name='delete_address'),
    path('project/<int:project_id>/update_addresses/', views.update_addresses, name='update_addresses'),
    path('assigned-events/', views.assigned_events_list, name='assigned_events_list'),
    path('assigned-events/remove/<int:event_id>/', views.remove_assigned_event, name='event_remove'),
    path('event/<int:event_id>/update-executors/', views.update_event_executors, name='update_event_executors'),
    path('remove_executor/', views.remove_executor, name='remove_executor'),
    path('assign_executor/', views.assign_executor, name='assign_executor'),
]