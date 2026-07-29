#!/usr/bin/env bash
set -Eeuo pipefail

DRIVE_URL="${DRIVE_URL:-https://drive.google.com/file/d/1bCkkDXuqMgVaINS5IScfbkxDVJfdjIeo/view?usp=share_link}"
OUT_DIR="${OUT_DIR:-dist/tiktok-shorts}"
WORK_DIR="${RUNNER_TEMP:-/tmp}/tiktok-shorts-${GITHUB_RUN_ID:-local}"
FONT_BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SOURCE="$WORK_DIR/source.mp4"

mkdir -p "$OUT_DIR" "$WORK_DIR"
rm -rf "$WORK_DIR"/* "$OUT_DIR"/*

command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null
python3 -m pip install --quiet --upgrade gdown

echo "Downloading authorized Drive master..."
gdown --fuzzy "$DRIVE_URL" --output "$SOURCE"
test -s "$SOURCE"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$SOURCE"

vertical_segment() {
  local start="$1" duration="$2" output="$3"
  ffmpeg -hide_banner -loglevel warning -y \
    -ss "$start" -t "$duration" -i "$SOURCE" \
    -filter_complex "[0:v]split=2[bg][fg];[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=22:3[bg2];[fg]scale=1080:-2[fg2];[bg2][fg2]overlay=(W-w)/2:(H-h)/2,format=yuv420p[v]" \
    -map "[v]" -map 0:a:0? -r 30 \
    -c:v libx264 -preset medium -crf 20 -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 160k -ar 48000 -ac 2 -movflags +faststart "$output"
}

concat_media() {
  local output="$1"; shift
  local list="$WORK_DIR/concat-$(basename "$output").txt"
  : > "$list"
  for file in "$@"; do printf "file '%s'\n" "$file" >> "$list"; done
  if ! ffmpeg -hide_banner -loglevel warning -y -f concat -safe 0 -i "$list" -c copy -movflags +faststart "$output"; then
    ffmpeg -hide_banner -loglevel warning -y -f concat -safe 0 -i "$list" \
      -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 \
      -c:a aac -b:a 160k -ar 48000 -ac 2 -movflags +faststart "$output"
  fi
}

make_card() {
  local text_file="$1" duration="$2" output="$3"
  ffmpeg -hide_banner -loglevel warning -y \
    -f lavfi -i "color=c=0x0c101c:s=1080x1920:r=30:d=${duration}" \
    -f lavfi -i "anullsrc=r=48000:cl=stereo" \
    -vf "drawtext=fontfile=${FONT_BOLD}:textfile=${text_file}:fontcolor=white:fontsize=76:line_spacing=18:x=(w-text_w)/2:y=(h-text_h)/2-120:box=1:boxcolor=0x181f34@0.96:boxborderw=54,drawtext=fontfile=${FONT_REG}:text='FULL VIDEO\: youtu.be/2gdK18bfaP4':fontcolor=0x60c4ff:fontsize=34:x=(w-text_w)/2:y=h-210" \
    -t "$duration" -shortest -c:v libx264 -preset medium -crf 18 \
    -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -ar 48000 -ac 2 \
    -movflags +faststart "$output"
}

caption_clip() {
  local input="$1" srt="$2" hook="$3" output="$4"
  ffmpeg -hide_banner -loglevel warning -y -i "$input" \
    -vf "subtitles=${srt}:force_style='FontName=DejaVu Sans,FontSize=26,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,BackColour=&H90000000,Outline=2,Alignment=2,MarginV=190',drawtext=fontfile=${FONT_BOLD}:textfile=${hook}:fontcolor=white:fontsize=52:line_spacing=8:x=(w-text_w)/2:y=110:box=1:boxcolor=black@0.66:boxborderw=22:enable='between(t,0,5.5)',drawtext=fontfile=${FONT_REG}:text='Full build\: youtu.be/2gdK18bfaP4':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=h-86:box=1:boxcolor=black@0.60:boxborderw=12" \
    -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 160k -ar 48000 -ac 2 -movflags +faststart "$output"
}

cat > "$WORK_DIR/end.txt" <<'EOF'
WANT THE FULL WORKFLOW?

WATCH THE COMPLETE BUILD
EOF
make_card "$WORK_DIR/end.txt" 2.4 "$WORK_DIR/end.mp4"

# 1. Joined main-highlights montage
vertical_segment 117.50 17.80 "$WORK_DIR/m1.mp4"
vertical_segment 590.05 18.78 "$WORK_DIR/m2.mp4"
vertical_segment 758.13 20.94 "$WORK_DIR/m3.mp4"
concat_media "$WORK_DIR/montage.mp4" "$WORK_DIR/m1.mp4" "$WORK_DIR/m2.mp4" "$WORK_DIR/m3.mp4"
cat > "$WORK_DIR/montage.srt" <<'EOF'
1
00:00:00,000 --> 00:00:06,500
I wrote a workflow that helps sort out his email problem.

2
00:00:06,500 --> 00:00:14,500
That made me think: if I can do this for someone else, I can do it for myself.

3
00:00:14,500 --> 00:00:17,800
That is what brought me to this system.

4
00:00:17,800 --> 00:00:25,000
If an email needs a reply, the AI already knows that.

5
00:00:25,000 --> 00:00:33,500
It classifies whether a reply is needed or it is only a notification.

6
00:00:33,500 --> 00:00:36,580
Then the drafting agent takes over.

7
00:00:36,580 --> 00:00:42,500
This workflow runs twice every day.

8
00:00:42,500 --> 00:00:49,500
It reads pending items I have not attended to.

9
00:00:49,500 --> 00:00:57,520
Then it builds an executive digest briefing for me.
EOF
cat > "$WORK_DIR/montage-hook.txt" <<'EOF'
I BUILT AN AI EMPLOYEE
THAT RUNS 4 INBOXES
EOF
cat > "$WORK_DIR/montage-card.txt" <<'EOF'
I BUILT AN AI EMPLOYEE

IT RUNS 4 INBOXES
EOF
make_card "$WORK_DIR/montage-card.txt" 1.6 "$WORK_DIR/montage-card.mp4"
caption_clip "$WORK_DIR/montage.mp4" "$WORK_DIR/montage.srt" "$WORK_DIR/montage-hook.txt" "$WORK_DIR/montage-captioned.mp4"
concat_media "$OUT_DIR/01-ai-employee-runs-4-inboxes.mp4" "$WORK_DIR/montage-card.mp4" "$WORK_DIR/montage-captioned.mp4" "$WORK_DIR/end.mp4"

# 2. AI reply drafting
vertical_segment 590.05 45.18 "$WORK_DIR/replies.mp4"
cat > "$WORK_DIR/replies.srt" <<'EOF'
1
00:00:00,000 --> 00:00:08,500
If the email needs a reply, this agent handles it.

2
00:00:08,500 --> 00:00:18,500
The AI has already classified the message and decided whether a reply is required.

3
00:00:18,500 --> 00:00:28,500
For every relevant email, it creates and finalizes a draft inside Gmail.

4
00:00:28,500 --> 00:00:36,500
If a draft is not needed, it routes the message to immediate alerts.

5
00:00:36,500 --> 00:00:45,180
For messages requiring action, it prepares the reply for my review.
EOF
cat > "$WORK_DIR/replies-hook.txt" <<'EOF'
MY AI READS EVERY EMAIL
THEN DRAFTS THE REPLY
EOF
cat > "$WORK_DIR/replies-card.txt" <<'EOF'
MY AI READS EVERY EMAIL

THEN DRAFTS THE REPLY
EOF
make_card "$WORK_DIR/replies-card.txt" 1.6 "$WORK_DIR/replies-card.mp4"
caption_clip "$WORK_DIR/replies.mp4" "$WORK_DIR/replies.srt" "$WORK_DIR/replies-hook.txt" "$WORK_DIR/replies-captioned.mp4"
concat_media "$OUT_DIR/02-ai-drafts-email-replies.mp4" "$WORK_DIR/replies-card.mp4" "$WORK_DIR/replies-captioned.mp4" "$WORK_DIR/end.mp4"

# 3. Twice-daily executive briefing
vertical_segment 758.13 45.90 "$WORK_DIR/digest.mp4"
cat > "$WORK_DIR/digest.srt" <<'EOF'
1
00:00:00,000 --> 00:00:08,000
The workflow runs twice a day: at 9 a.m. and 5 p.m.

2
00:00:08,000 --> 00:00:18,000
It reads pending items and anything I have not attended to.

3
00:00:18,000 --> 00:00:28,000
Then the AI reads the digest and prepares a complete briefing.

4
00:00:28,000 --> 00:00:38,000
It explains every email like a capable human executive assistant.

5
00:00:38,000 --> 00:00:45,900
No technical classifier output: only what matters and what to do next.
EOF
cat > "$WORK_DIR/digest-hook.txt" <<'EOF'
I STOPPED CHECKING 4 INBOXES
AI BRIEFS ME TWICE DAILY
EOF
cat > "$WORK_DIR/digest-card.txt" <<'EOF'
I STOPPED CHECKING 4 INBOXES

AI BRIEFS ME TWICE DAILY
EOF
make_card "$WORK_DIR/digest-card.txt" 1.6 "$WORK_DIR/digest-card.mp4"
caption_clip "$WORK_DIR/digest.mp4" "$WORK_DIR/digest.srt" "$WORK_DIR/digest-hook.txt" "$WORK_DIR/digest-captioned.mp4"
concat_media "$OUT_DIR/03-ai-executive-inbox-briefing.mp4" "$WORK_DIR/digest-card.mp4" "$WORK_DIR/digest-captioned.mp4" "$WORK_DIR/end.mp4"

cat > "$OUT_DIR/POSTING-COPY-AND-HOOKS.txt" <<'EOF'
SOURCE: https://youtu.be/2gdK18bfaP4

SHORT 1 — MAIN HIGHLIGHTS
Primary hook: I built an AI employee that runs four inboxes.
Alternatives:
- Four Gmail accounts. One AI employee. Zero inbox chaos.
- I gave AI control of my inbox — here is what happened.
- This AI reads, sorts, drafts, and briefs me every day.
- I stopped managing email manually after building this.
Caption: I built an AI employee that manages four Gmail accounts, prepares replies, and briefs me twice daily. Full build: https://youtu.be/2gdK18bfaP4

SHORT 2 — REPLY DRAFTING
Primary hook: My AI reads every email, then drafts the reply.
Alternatives:
- This AI knows which emails deserve a response.
- I no longer start email replies from a blank page.
- The moment an important email lands, AI prepares my draft.
- My inbox now has its own executive assistant.
Caption: This workflow decides whether an email needs a reply, drafts it inside Gmail, and alerts me when action is required. Full video: https://youtu.be/2gdK18bfaP4

SHORT 3 — EXECUTIVE BRIEFING
Primary hook: I stopped checking four inboxes — AI briefs me twice daily.
Alternatives:
- My inbox sends me a morning and evening executive briefing.
- Instead of reading every email, I read one AI-generated briefing.
- This AI tells me what matters, why it matters, and what to do next.
- Four inboxes become one clear action list automatically.
Caption: Twice daily, my AI reviews pending emails and briefs me like an executive assistant. Full workflow: https://youtu.be/2gdK18bfaP4

HASHTAGS
#AIAutomation #n8n #AIAgents #EmailAutomation #GmailAutomation #WorkflowAutomation #DevOps #TechTok
EOF

for file in "$OUT_DIR"/*.mp4; do
  ffprobe -v error -show_entries stream=width,height,codec_name -show_entries format=duration,size -of default=noprint_wrappers=1 "$file"
done
sha256sum "$OUT_DIR"/* > "$OUT_DIR/SHA256SUMS.txt"
ls -lh "$OUT_DIR"
