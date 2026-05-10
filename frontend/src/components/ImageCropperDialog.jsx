import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/canvasUtils.js"; // Adjust path as needed
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export function ImageCropperDialog({ 
  imageSrc, 
  open, 
  setOpen, 
  onCropComplete // Parent function that receives the final File
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Capture the coordinates when the user stops dragging
  const onCropChangeComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Triggered when "Apply Crop" is clicked
  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // Convert Blob to File
      const croppedFile = new File([croppedBlob], "avatar_cropped.jpg", { type: "image/jpeg" });
      
      // Send file back to parent
      onCropComplete(croppedFile); 
      setOpen(false);
      
      // Reset local state
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    } catch (error) {
      console.error("Crop failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-75 bg-black/5 rounded-md overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1} // Square
              onCropChange={setCrop}
              onCropComplete={onCropChangeComplete}
              onZoomChange={setZoom}
            />
          )}
        </div>

        <div className="py-4 space-y-2">
           <div className="flex justify-between text-sm text-muted-foreground">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
           </div>
           <Slider 
              value={[zoom]} 
              min={1} 
              max={3} 
              step={0.1} 
              onValueChange={(vals) => setZoom(vals[0])} 
           />
        </div>

        <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setOpen(false)} disabled={isProcessing}
              className={'cursor-pointer'}
            >
             Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isProcessing}
              className={'cursor-pointer'}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Crop
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}