"use client"

import { useState } from 'react';
import OpenAI from 'openai';
import { Groq } from 'groq-sdk';

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [podcastContent, setPodcastContent] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openApiKey, setOpenApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');

  const generatePodcastText = async () => {
    setLoading(true);
    setError(null);
    try {
      const groq = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true });
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are podcast generating AI. User will send you text and you will create a podcast episode script, it should be around 10 minutes when read aloud. Make sure you speak in the tone of voice like podcasts, explain it simply and have lighthearted style of talking. Everything you generate will be read out loud, so no square brackets, special instrcutions, titles, only plain text that will be fully read in a lighhearted podcast style."
          },
          {
            role: "user",
            content: userInput
          }
        ],
        model: "llama3-8b-8192",
        temperature: 1,
        max_tokens: 8192,
        top_p: 1,
        stream: false,
        stop: null
      });
      setPodcastContent(chatCompletion.choices[0]?.message?.content || '');
    } catch (err) {
      console.log(err)
      setError('Error generating podcast content');
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async () => {
    setLoading(true);
    setError(null);
    setAudioUrl('');
    try {
      const openai = new OpenAI({ apiKey: openApiKey, dangerouslyAllowBrowser: true });
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: podcastContent,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const blob = new Blob([buffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      console.log(err)
      setError('Error generating audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-8">Podcast Generator and Text to Speech</h1>

      <input
        type="password"
        value={openApiKey}
        onChange={(e) => setOpenApiKey(e.target.value)}
        placeholder="Enter OpenAI API Key"
        className="w-full max-w-md px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <input
        type="password"
        value={groqApiKey}
        onChange={(e) => setGroqApiKey(e.target.value)}
        placeholder="Enter Groq API Key"
        className="w-full max-w-md px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Enter podcast topic"
        className="w-full max-w-md px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        rows={4}
      />

      <button
        onClick={generatePodcastText}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
        disabled={loading || !openApiKey || !groqApiKey || !userInput}
      >
        {loading ? 'Generating...' : 'Generate Podcast Content'}
      </button>

      {podcastContent && (
        <>
          <textarea
            value={podcastContent}
            onChange={(e) => setPodcastContent(e.target.value)}
            className="w-full max-w-md px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={10}
          />

          <button
            onClick={generateAudio}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 mb-4"
            disabled={loading || !openApiKey || !podcastContent}
          >
            {loading ? 'Generating...' : 'Generate Voice'}
          </button>
        </>
      )}

      {error && <p className="text-red-500">{error}</p>}

      {audioUrl && (
        <div className="mt-8 w-full max-w-md">
          <audio controls className="w-full">
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <a
            href={audioUrl}
            download="podcast.mp3"
            className="mt-4 inline-block text-blue-500 hover:underline"
          >
            Download Audio
          </a>
        </div>
      )}
    </div>
  );
}