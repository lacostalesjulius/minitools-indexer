import { createElement, isValidURL } from '/tools/helpers.js'
import { State } from '/tools/state.js'

const createMediaDlUI = () => {
  const parent = createElement('div', 'service-form');

  const search_div = createElement('div', 'service-form-field');
  const info_div = createElement('div', 'service-form-field-row');
  const download_div = createElement('div', 'service-form-field');

  const search_field_div = createElement('div', 'service-form-field-row');
  const search_button = createElement('button', 'service-button service-button-submit');
  search_button.innerHTML = 'Search';
  search_button.onclick = async() => {
    const target_url = search_box.value;
    if ( !isValidURL(target_url) ) {
      search_field_div.classList.add('warning');
      setTimeout(() => search_field_div.classList.remove('warning'), 1500);
      return;
    }
    const res = await fetch(`/api/services/media-downloader/meta?url=${target_url}`);
    const data = await res.json();
    media_metadata.value = data;
  };

  const search_label = createElement('label', 'service-form-field no-fill');
  search_label.innerHTML = 'Search: ';
  const search_box = createElement('input', 'service-form-field');
  search_box.placeholder = 'https://..';

  const thumb = createElement('img', 'service-thumb');
  thumb.src = '';
  const metadata = createElement('div', 'service-form-field');

  const title_div = createElement('div', 'service-form-field-row');
  const title_label = createElement('span', 'service-form-label');
  title_label.innerHTML = 'Title: ';
  const title = createElement('span', 'service-form-property');

  const duration_div = createElement('div', 'service-form-field-row');
  const duration_label = createElement('span', 'service-form-label');
  duration_label.innerHTML = 'Duration: ';
  const duration = createElement('span', 'service-form-property');

  const resolution_div = createElement('div', 'service-form-field');
  const resolution_label = createElement('label', 'service-form-label');
  resolution_label.innerHTML = 'Resolution: ';
  const resolution = createElement('select', 'service-select');
  resolution.onchange = (e) => {
    media_format.value = {
      resolution: e.target.value,
      audio: 'best'
    };
  }
  const video_ext_div = createElement('div', 'service-form-field-row');
  const video_ext_label = createElement('span', 'service-form-label no-fill');
  video_ext_label.innerHTML = 'Ensure [.mp4]:'
  const video_ext_check = createElement('input', 'service-option no-fill');
  video_ext_check.type = 'checkbox';
  video_ext_check.value = 'mp4';
  video_ext_check.onchange = (e) => media_ext.value = { mp4: e.target.checked, mp3: media_ext.value['mp3'] }

  const audio_div = createElement('div', 'service-form-field');
  const audio_label = createElement('label', 'service-form-label');
  audio_label.innerHTML = 'Audio Format: ';
  const audio = createElement('select', 'service-select');
  audio.disabled = true;

  const audio_ext_div = createElement('div', 'service-form-field-row');
  const audio_ext_label = createElement('span', 'service-form-label no-fill');
  audio_ext_label.innerHTML = 'Ensure [.mp3]:'
  const audio_ext_check = createElement('input', 'service-option no-fill');
  audio_ext_check.type = 'checkbox';
  audio_ext_check.value = 'mp3';
  audio_ext_check.disabled = true;
  audio_ext_check.onchange = (e) => media_ext.value = { mp4: media_ext.value['mp4'], mp3: e.target.checked }

  const ensure_warning = createElement('span', 'service-form-label warning hidden');
  ensure_warning.innerHTML = 'Ensuring extension encoding (.mp3|.mp4) format will add to the encoding job and slows down the file serving.';
  const download_button = createElement('button', 'service-button service-button-download');
  download_button.innerHTML = 'Download';
  download_button.onclick = async() => downloadWhenReady();

  parent.appendChild(search_div);
  parent.appendChild(info_div);
  parent.appendChild(download_div);

  search_div.appendChild(search_field_div);
  search_div.appendChild(search_button);
  search_field_div.appendChild(search_label);
  search_field_div.appendChild(search_box);
  
  info_div.appendChild(thumb);
  info_div.appendChild(metadata);

  metadata.appendChild(title_div);
  metadata.appendChild(duration_div);
  metadata.appendChild(resolution_div);
  metadata.appendChild(video_ext_div);
  metadata.appendChild(audio_div);
  metadata.appendChild(audio_ext_div);

  title_div.appendChild(title_label);
  title_div.appendChild(title);

  duration_div.appendChild(duration_label);
  duration_div.appendChild(duration);
 
  resolution_div.appendChild(resolution_label);
  resolution_div.appendChild(resolution); 

  video_ext_div.appendChild(video_ext_label);
  video_ext_div.appendChild(video_ext_check);
 
  audio_div.appendChild(audio_label);
  audio_div.appendChild(audio); 

  audio_ext_div.appendChild(audio_ext_label);
  audio_ext_div.appendChild(audio_ext_check);

  download_div.appendChild(ensure_warning);
  download_div.appendChild(download_button);

  return { parent, thumb, title, duration, resolution, audio, search_box, audio_ext_check, video_ext_check, download_button, ensure_warning, info_div }
}

export const yt_dlp_ui = createMediaDlUI();

/* State */
const media_metadata = new State(null);
const media_format = new State({
  resolution: '1080',
  audio: null,
})
const media_ext = new State({
  mp4: false,
  mp3: false
})
const dl_state = new State({status: 'not-started'});

/* Hook */
media_metadata.use((n, p) => {
  if (!n || n == p) return;
  const ui = yt_dlp_ui

  console.log(n)

  ui.thumb.src = media_metadata.value.thumbnail;
  ui.title.innerHTML = media_metadata.value.title;
  ui.duration.innerHTML = media_metadata.value.duration;
  
  media_metadata.value.video.sort((a, b) => b.height - a.height);
  media_metadata.value.audio.sort((a, b) => b.abr - a.abr);

  const bracket = videoFormatBracket(media_metadata.value.video);

  ui.resolution.innerHTML = ''
  ui.audio.innerHTML = ''

  for (const [key, value] of Object.entries(bracket).sort((a, b) => Number(b[0]) - Number(a[0]))) {
    if (!value) continue;
    let selected = (key == '1080') ? 'selected="selected"' : '';
    const new_option = `<option value='${key}' ${selected}>${key}p</option>`;
    ui.resolution.innerHTML += new_option;
  }  
  ui.audio.innerHTML += `<option value="best">-- Best Audio --</option>`;
  media_metadata.value.audio.forEach((data) => {
    const new_option = `<option value="best">${data.abr} + ${data.ext}</option>`
    ui.audio.innerHTML += new_option;
  });
  ui.resolution.innerHTML += `<option value="audio">-- Audio Only --</option>`;
})
media_format.use((n, p) => {
  if (!n || n == p) return;

  if (media_format.value.resolution == 'audio') {
    console.log(media_format.value.resolution == 'audio');
    yt_dlp_ui.audio.removeAttribute('disabled');
    yt_dlp_ui.audio_ext_check.removeAttribute('disabled');
    yt_dlp_ui.video_ext_check.disabled = true;
  }
  else {
    yt_dlp_ui.audio.disabled = true;
    yt_dlp_ui.audio_ext_check.disabled = true;
    yt_dlp_ui.video_ext_check.removeAttribute('disabled');
  }
})
media_ext.use((n, p) => {
  if (!n || n == p) return;
  console.log(n);
  if (n['mp3'] || n['mp4']) yt_dlp_ui.ensure_warning.classList.remove('hidden');
  else yt_dlp_ui.ensure_warning.classList.add('hidden');
})
dl_state.use((n, p) => {
  if (n == p) return;

  switch(n.status) {
    case 'starting':
      yt_dlp_ui.download_button.classList.add('downloading');
      yt_dlp_ui.download_button.innerHTML = 'File being ready to be served';
      break;
    case 'downloading':
      yt_dlp_ui.download_button.classList.add('downloading');
      yt_dlp_ui.download_button.innerHTML = 'Server Download and Transcoding... Please wait.';
      break;
    case 'ready':
      yt_dlp_ui.download_button.classList.remove('downloading');
      yt_dlp_ui.download_button.innerHTML = 'File Served.';
      setTimeout(() => dl_state.value = {status: 'not-started'}, 2500);
      break;
    default:
      yt_dlp_ui.download_button.classList.remove('downloading');
      yt_dlp_ui.download_button.innerHTML = 'Download';
  }
})

const videoFormatBracket = (formats) => {
  let Bracket = {
    '1440': null,
    '1080': null,
    '720': null,
    '480': null,
    '360': null,
    '240': null,
    '144': null,
  }

  formats.forEach(format => {
    if (format.ext != 'mp4') return;
    if (format.height < 144) Bracket[144] = format;
    else if (format.height < 240) Bracket[240] = format;    
    else if (format.height < 360) Bracket[360] = format;
    else if (format.height < 480) Bracket[480] = format;
    else if (format.height < 720) Bracket[720] = format;
    else if (format.height < 1080) Bracket[1080] = format;
    else if (format.height >= 1080) Bracket[1440] = format;
  })

  return Bracket;
}

async function downloadWhenReady() {
  if (!media_metadata.value) {
    yt_dlp_ui.info_div.classList.add('warning');
    setTimeout(() => yt_dlp_ui.info_div.classList.remove('warning'), 1500)
    return;
  }

  const vid = media_metadata.value.id;
  const url = `/api/services/media-downloader/download`;
  const trigger_url = `/api/services/media-downloader/download/${vid}`;

  try {
    console.log('fetching for download to start')
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: `https://youtu.be/${vid}`,
        vid: vid,
        format: media_format.value,
        ext: media_ext.value
      })
    });

    const contentType = res.headers.get("content-type") || "";
    console.log('content-type: ' + contentType)

    if (contentType.includes("application/json")) {
      const data = await res.json();
      console.log(data);
      dl_state.value = data;

      if (data.status && data.status !== "ready") {
        setTimeout(triggerDownload, 2000, trigger_url);
        console.log('Entering loop')
        return;
      }
    }
  } catch (err) {
    console.error("Download error:", err);
  }
}

async function triggerDownload(url) {
  const res = await fetch(url + "/status");
  const data = await res.json();

  console.log(data);
  dl_state.value = data;

  if (data.status === "ready") {
    console.log("Downloading:", data.file);

    const a = document.createElement('a');
    a.href = url;
    a.download = ''; 
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  else if (!res.ok) {
    console.log('Error')
  }
  else {
    setTimeout(triggerDownload, 2000, url)
  }
}
