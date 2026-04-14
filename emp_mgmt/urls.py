from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),
    path('api/', include('employees.urls')),
    # Frontend page routes
    path('', RedirectView.as_view(url='/login/', permanent=False)),
    path('', include('core.page_urls')),
    path('', include('employees.page_urls')),
]
