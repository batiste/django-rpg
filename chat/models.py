from django.db import models

# not use right now
class Map(models.Model):
    
    name = models.CharField(max_length=50, blank=True)
    x = models.IntegerField()
    y = models.IntegerField()

    content = models.TextField()

    def serialized(self):
        return {
            "id":self.id,
            "x":self.x,
            "y":self.y,
            "name":self.name,
            "content":self.content
        }

    def __unicode__(self):
        return self.name