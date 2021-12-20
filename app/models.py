from django.db import models

class Message(models.Model):
  sender = models.TextField()
  target = models.TextField()
  content = models.TextField()
  timestamp = models.DateTimeField()

  class Meta:
        app_label = 'app'