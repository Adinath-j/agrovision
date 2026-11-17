from django.urls import path
from .views import ChatEndpointView, ChatHistoryView, ConversationMessagesView

urlpatterns = [
    path('chat/', ChatEndpointView.as_view(), name='assistant-chat'),
    path('history/', ChatHistoryView.as_view(), name='assistant-history'),
    path('conversations/<int:conv_id>/', ConversationMessagesView.as_view(), name='assistant-conversation-messages'),
]
