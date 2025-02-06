import { useEffect, useRef } from 'react';
import Peer from 'simple-peer';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Define the SignalData interface
interface SignalData {
    type: 'offer' | 'answer' | 'candidate'; // Adjust based on your signaling needs
    sdp?: string; // For offer/answer
    candidate?: {
        candidate: string;
        sdpMid?: string;
        sdpMLineIndex?: number;
    }; // For ICE candidates
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

        peer.on('signal', (data: SignalData) => {
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
            if (data.type === 'offer' || data.type === 'answer') {
                peer.signal({
                    type: data.type,
                    sdp: data.sdp // Pass the SDP if it's an offer or answer
                }); // Use the received signal data
            } else if (data.candidate) {
                const candidate = new RTCIceCandidate(data.candidate); // Create an RTCIceCandidate instance
                peer.signal({
                    type: 'candidate', // Set the type to 'candidate'
                    candidate: candidate // Pass the RTCIceCandidate instance
                }); // Handle ICE candidates
            }
        });

        return () => {
            peer.destroy();
            socketRef.current.disconnect(); // Clean up socket connection
        };
    }, []);

    return (
        <div>
            <video ref={userVideo} autoPlay playsInline>
                <track kind="captions" srcLang="en" src="" label="English" default />
            </video>
            <video ref={partnerVideo} autoPlay playsInline>
                <track kind="captions" srcLang="en" src="" label="English" default />
            </video>
        </div>
    );
};

export default VideoChat; 