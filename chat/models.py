from django.db import models

# not use right now
class MapElement(models.Model):
    
    name = models.CharField(max_length=50)
    x_pos = models.IntegerField()
    y_pos = models.IntegerField()

    content = models.TextField()

    def __unicode__(self):
        return self.name