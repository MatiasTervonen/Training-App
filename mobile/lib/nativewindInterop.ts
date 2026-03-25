// nativewindInterop.ts
import { cssInterop } from "nativewind";
import { Image } from "expo-image";
import { CameraView } from "expo-camera";

cssInterop(Image, {
  className: "style",
});

cssInterop(CameraView, {
  className: "style",
});
