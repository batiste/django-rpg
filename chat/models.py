from django.db import models

# not use right now
class Map(models.Model):
    
    name = models.CharField(max_length=50, blank=True)
    x = models.IntegerField()
    y = models.IntegerField()

    content = models.TextField()

    def serialized(self):
        content = self.content.replace("\n", "")
        content = content.replace("\r", "")
        content = content.replace("\s", "")
        return {
            "id":self.id,
            "x":self.x,
            "y":self.y,
            "name":self.name,
            "content":self.content.replace("\n", "")
        }

    def __unicode__(self):
        return self.name