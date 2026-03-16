"""
Audio Extractor Service

Extracts 16kHz mono WAV audio from a video file using FFmpeg.
"""

import os
import glob
import shutil
import subprocess
import tempfile


def _resolve_ffmpeg_path() -> str | None:
    """Resolve ffmpeg from PATH, env override, or common Windows install locations."""
    candidates = []

    env_path = os.environ.get("FFMPEG_PATH")
    if env_path:
        candidates.append(env_path)

    which_path = shutil.which("ffmpeg")
    if which_path:
        candidates.append(which_path)

    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        candidates.append(os.path.join(local_app_data, "Microsoft", "WinGet", "Links", "ffmpeg.exe"))

    program_files = [os.environ.get("ProgramFiles"), os.environ.get("ProgramFiles(x86)")]
    for base in program_files:
        if not base:
            continue

        candidates.extend([
            os.path.join(base, "FFmpeg", "bin", "ffmpeg.exe"),
            os.path.join(base, "Gyan", "FFmpeg", "bin", "ffmpeg.exe"),
        ])

        candidates.extend(glob.glob(os.path.join(base, "ffmpeg*", "bin", "ffmpeg.exe")))
        candidates.extend(glob.glob(os.path.join(base, "Gyan*", "ffmpeg*", "bin", "ffmpeg.exe")))

    # Common manual installs on drive roots, e.g. D:\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe
    for drive in ("C:\\", "D:\\", "E:\\"):
        candidates.extend(glob.glob(os.path.join(drive, "ffmpeg*", "bin", "ffmpeg.exe")))

    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            return candidate

    return None


def extract_audio_from_video(video_path: str) -> str:
    """
    Extract WAV audio from a video file using FFmpeg.

    The output audio is always:
    - WAV (pcm_s16le)
    - 16kHz sample rate
    - mono channel

    Args:
        video_path: Local path to video file.

    Returns:
        str: Path to extracted WAV file.

    Raises:
        FileNotFoundError: If input video does not exist.
        RuntimeError: If FFmpeg is not installed or extraction fails.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    ffmpeg_path = _resolve_ffmpeg_path()
    if ffmpeg_path is None:
        raise RuntimeError("FFmpeg is not installed or not available in PATH")

    temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    temp_audio.close()

    command = [
        ffmpeg_path,
        "-y",
        "-i",
        video_path,
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        temp_audio.name,
    ]

    print("\n🔊 [AUDIO] Extracting audio from video with FFmpeg...", flush=True)
    print(f"🛠️  [AUDIO] FFmpeg: {ffmpeg_path}", flush=True)
    print(f"📁 Video: {video_path}", flush=True)
    print(f"📁 Audio: {temp_audio.name}", flush=True)

    try:
        process = subprocess.run(command, capture_output=True, text=True, check=False)

        if process.returncode != 0:
            if os.path.exists(temp_audio.name):
                os.remove(temp_audio.name)

            stderr = (process.stderr or "").strip()
            raise RuntimeError(f"FFmpeg audio extraction failed: {stderr}")

        print("✅ [AUDIO] Audio extraction completed", flush=True)
        return temp_audio.name
    except Exception:
        if os.path.exists(temp_audio.name):
            os.remove(temp_audio.name)
        raise
