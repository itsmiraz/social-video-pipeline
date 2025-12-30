import ffmpeg from "fluent-ffmpeg";
import { config } from "../config";
import os from "os";

if (os.platform() === "win32") {
  ffmpeg.setFfmpegPath("C:\\PATH_Programs\\ffmpeg.exe"); // Set the path to ffmpeg binary
} else {
  ffmpeg.setFfmpegPath(`${config.ffmpegPath}`);
}
// ffmpeg.setFfmpegPath(config.ffmpegPath);

export default ffmpeg;
