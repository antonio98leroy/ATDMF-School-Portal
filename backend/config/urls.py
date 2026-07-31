from django.contrib import admin
from django.urls import include,path
from django.conf import settings
from django.conf.urls.static import static
urlpatterns=[path('admin/',admin.site.urls),path('api/auth/',include('accounts.urls')),path('api/students/',include('students.urls')),path('api/staff/',include('staff.urls')),path('api/academics/',include('academics.urls')),path('api/attendance/',include('attendance.urls')),path('api/examinations/',include('examinations.urls')),path('api/finance/',include('finance.urls')),path('api/communications/',include('communications.urls')),path('api/audit/',include('audit.urls'))]
if settings.DEBUG: urlpatterns += static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)
