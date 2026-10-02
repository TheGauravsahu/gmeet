import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  Users,
  MessageSquare,
  PhoneOff,
} from 'lucide-react';

export default function MeetingDock({
  isMicOn,
  toggleMic,
  isVideoOn,
  toggleCamera,
  isScreenSharing,
  toggleScreenShare,
  isHandRaised,
  toggleRaiseHand,
  activeDrawer,
  setActiveDrawer,
  totalParticipants,
  unreadChatCount,
  setUnreadChatCount,
  handleLeaveCall,
}) {
  return (
    <footer className={`meeting-dock-bar ${activeDrawer ? 'drawer-open' : ''}`}>
      <div className="dock-controls-group">
        {/* Microphone */}
        <button
          className={`dock-circle-btn ${!isMicOn ? 'btn-danger' : 'btn-active'}`}
          onClick={toggleMic}
          title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Camera */}
        <button
          className={`dock-circle-btn ${!isVideoOn ? 'btn-danger' : 'btn-active'}`}
          onClick={toggleCamera}
          title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Screen Share */}
        <button
          className={`dock-circle-btn ${isScreenSharing ? 'btn-highlight' : ''}`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <Monitor size={20} />
        </button>

        {/* Hand Raise */}
        <button
          className={`dock-circle-btn ${isHandRaised ? 'btn-hand-raised' : ''}`}
          onClick={toggleRaiseHand}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand size={20} />
        </button>

        <div className="dock-separator" />

        {/* Participants Toggle */}
        <button
          className={`dock-circle-btn ${
            activeDrawer === 'participants' ? 'btn-highlight' : ''
          }`}
          onClick={() =>
            setActiveDrawer(activeDrawer === 'participants' ? null : 'participants')
          }
          title="Participants"
        >
          <Users size={20} />
          <span className="dock-badge-count">{totalParticipants}</span>
        </button>

        {/* Chat Toggle */}
        <button
          className={`dock-circle-btn ${
            activeDrawer === 'chat' ? 'btn-highlight' : ''
          }`}
          onClick={() => {
            setActiveDrawer(activeDrawer === 'chat' ? null : 'chat');
            setUnreadChatCount(0);
          }}
          title="In-Call Chat & Aura AI"
        >
          <MessageSquare size={20} />
          {unreadChatCount > 0 && (
            <span className="dock-badge-unread">{unreadChatCount}</span>
          )}
        </button>

        {/* Leave Call */}
        <button
          className="dock-end-call-btn"
          onClick={handleLeaveCall}
          title="Leave Meeting"
        >
          <PhoneOff size={20} />
          <span>Leave</span>
        </button>
      </div>
    </footer>
  );
}
