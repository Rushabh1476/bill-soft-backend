from PIL import Image
import os

def process_logo():
    input_path = r'd:\billsoft\rushbh\billsoft_saas\frontend\public\logo.png'
    output_path = r'd:\billsoft\rushbh\billsoft_saas\frontend\public\favicon.png'
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        return

    # Open the image
    img = Image.open(input_path).convert("RGBA")
    
    # Get the bounding box of non-transparent pixels
    bbox = img.getbbox()
    if not bbox:
        print("Error: Image is empty/fully transparent")
        return
        
    # Crop to the bounding box
    cropped = img.crop(bbox)
    
    # Make it square
    w, h = cropped.size
    size = max(w, h)
    
    # Create a new square transparent image
    new_img = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    
    # Paste the cropped image into the center
    offset = ((size - w) // 2, (size - h) // 2)
    new_img.paste(cropped, offset)
    
    # Save as favicon.png
    new_img.save(output_path, "PNG")
    print(f"Successfully cropped and saved to {output_path}")

if __name__ == "__main__":
    process_logo()
