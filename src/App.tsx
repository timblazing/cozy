import { Film } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import videojs, { VideoJsPlayer } from 'video.js';
import 'video.js/dist/video-js.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { Video } from './types';

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const player = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        if (import.meta.env.DEV) {
          // Mock data for development
          setVideos([]);
        } else {
          const response = await fetch('/videos');
          if (!response.ok) {
            throw new Error(`Failed to fetch video list: ${response.status} ${response.statusText}`);
          }
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const links = Array.from(doc.querySelectorAll('a'));
          const videoFiles = links
            .map(link => link.getAttribute('href')?.replace('/videos/', ''))
            .filter((filename): filename is string => !!filename && /\.(mp4|webm|mov)$/i.test(filename.toLowerCase()))
            .map((filename, index) => ({
              id: String(index + 1),
              title: filename ? filename.replace(/\.[^/.]+$/, '') : 'Unknown',
              path: filename
            }));
          setVideos(videoFiles);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        setError('Failed to load videos. Please check your network connection and server configuration.');
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    if (selectedVideo && videoRef.current) {
      if (player.current) {
        player.current.dispose();
      }

      const videoSource = `/videos/${selectedVideo.path}`;
      const videoType = selectedVideo.path.toLowerCase().endsWith('.webm') ? 'video/webm' :
                       selectedVideo.path.toLowerCase().endsWith('.mov') ? 'video/quicktime' :
                       'video/mp4';

      player.current = videojs(videoRef.current, {
        controls: true,
        autoplay: true,
        preload: 'auto',
        sources: [{
          src: videoSource,
          type: videoType
        }]
      });
    }
    return () => {
      if (player.current) {
        player.current.dispose();
      }
    };
  }, [selectedVideo]);

  if (loading) {
    return (
      <div className="min-h-screen loading-background text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen error-background text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white text-gray-900 rounded hover:bg-gray-100"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-300 text-white p-4 md:p-8 relative">
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-40"></div>
      )}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <video ref={videoRef} className="video-js vjs-default-skin vjs-big-play-centered w-full rounded-lg shadow-lg" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 my-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter YouTube URL"
                  className="flex-grow p-2 border border-gray-300 rounded text-black"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <button
                  className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                  onClick={async () => {
                    const response = await fetch('/download', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ url: youtubeUrl }),
                    });
                    if (response.ok) {
                      console.log('Download initiated');
                    } else {
                      console.error('Download failed');
                    }
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
        {videos.length > 0 ? (
          videos.map((video) => (
            <div
              key={video.id}
              className="cursor-pointer group relative aspect-video rounded-lg overflow-hidden bg-gray-800"
              onClick={() => setSelectedVideo(video)}
            >
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${window.innerWidth < 768 ? 'opacity-100' : 'opacity-0 group-hover:opacity-80 bg-black bg-opacity-40'}`}>
                <FontAwesomeIcon icon={faPlay} className="text-white text-4xl" />
              </div>
              <img
                src={`/thumbnail/${video.path}`}
                alt={`${video.title} Thumbnail`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                <h3 className="text-white text-sm font-medium truncate">{video.title}</h3>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Film className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-600 text-lg">No videos found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
