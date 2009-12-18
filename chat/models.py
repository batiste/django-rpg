from django.db import models
import simplejson
import math

# not use right now
class Map(models.Model):
    
    name = models.CharField(max_length=50, blank=True)
    x = models.IntegerField()
    y = models.IntegerField()

    forbidden = [
            [9, 1],[10, 2],[0, 9],[1, 9],[2, 9],[0, 10],[1, 10],
            [2, 10],[3, 10],[4, 10],[5, 10],[8, 9], [6, 8], [6, 10],
            [7, 9],[7, 8],[7, 10],[6, 7], [6, 9],[9, 7],[10, 7],
            [8, 8], [8 ,10], [9, 8],
            [10, 8],[9, 9],[9, 10],[10, 10]
    ]

    content = models.TextField()

    def serialized(self):
        return {
            "id":self.id,
            "x":self.x,
            "y":self.y,
            "name":self.name,
            "content":self.content.replace("\n", "")
        }

    _ground = None

    def get_ground(self):
        try:
            self._ground = simplejson.loads(self.content.replace("\n", ""))
        except (ValueError):
            pass
        return self._ground

    def set_ground(self, content):
        self.content = content.replace("\n", "")
        self.get_ground()

    ground = property(get_ground, set_ground)

    def is_safe_position(self, pos):
        if self.ground is None:
            return False
        x = int(math.floor((pos[0]) / 16))
        y = int(math.floor((pos[1]) / 16))
        if x <= 0 or y <= 0:
            return False
        if x >= 16 * len(self.ground) -1:
            return False
        if y >= 16 * len(self.ground[0]):
            return False
        block = self.ground[x][y]
        if block in self.forbidden:
            return False
        return True


    def __unicode__(self):
        return self.name