import { useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface SignalData {
    // Define the properties of the signal data here
    type: string;
    sdp?: string;
    candidate?: string;
}

const VideoChat = () => {
    const userVideo = useRef<HTMLVideoElement>(null);
    const partnerVideo = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer.Instance | null>(null);
    const socketRef = useRef<any>(null); // Create a ref for the socket

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(BACKEND_URL);

        const peer = new Peer({ initiator: true, trickle: false });

        peer.on('signal', (data) => {
            // Send the signal data to the other peer
            socketRef.current.emit('signal', data); // Emit the signal data through the socket
        });

        peer.on('stream', (stream) => {
            if (partnerVideo.current) {
                partnerVideo.current.srcObject = stream;
            }
        });

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (userVideo.current) {
                    userVideo.current.srcObject = stream;
                }
                peer.addStream(stream);
            });

        peerRef.current = peer;

        // Listen for incoming signal data
        socketRef.current.on('signal', (data: SignalData) => {
            peer.signal(data); // Use the received signal data
        });

        return () => {
            peer.destroy();
            socketRef.current.disconnect(); // Clean up socket connection
        };
    }, []);

    return (
        <div>
            <video ref={userVideo} autoPlay playsInline />
            <video ref={partnerVideo} autoPlay playsInline />
        </div>
    );
};

export default VideoChat; 