from PIL import Image, ImageDraw, ImageFont
import textwrap

# Create a new image with white background
width, height = 1200, 1600
image = Image.new('RGB', (width, height), (255, 255, 255))
draw = ImageDraw.Draw(image)

# Try to load a font, or use default
try:
    font = ImageFont.truetype("DejaVuSans.ttf", 20)
except IOError:
    font = ImageFont.load_default()

# Read the flowchart text from the file
with open('userflow.md', 'r', encoding='utf-8') as f:
    flowchart_text = f.read()

# Draw the flowchart text on the image
lines = flowchart_text.split('\n')
y_position = 50
for line in lines:
    # Wrap long lines
    wrapped_lines = textwrap.wrap(line, width=80)
    for wrapped_line in wrapped_lines:
        draw.text((50, y_position), wrapped_line, font=font, fill=(0, 0, 0))
        y_position += 30

# Save the image
image.save('userflow.png')
print("Image saved as userflow.png")