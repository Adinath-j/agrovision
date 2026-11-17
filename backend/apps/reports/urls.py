from django.urls import path
from .views import YieldReportView, FarmReportView, ReportListView

urlpatterns = [
    path('yield/', YieldReportView.as_view(), name='report-yield'),
    path('farm/', FarmReportView.as_view(), name='report-farm'),
    path('list/', ReportListView.as_view(), name='report-list'),
]
