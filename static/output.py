
import Image
im = Image.open("walk2.png")
size = im.size

x=0
lines = []
print "var character_map = ["
while x < size[0]:
    y = 0
    print "["
    while y < size[1]:
        pixel = im.getpixel((x,y))
        print "[%d,%d,%d,%d]," % pixel
        y += 1
    print "],"
    x += 1
print "];"