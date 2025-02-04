

const Modal = ({ onClose, children }: { onClose: () => void, children: React.ReactNode }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="close-button">Close</button>
        {children}
      </div>
    </div>
  );
};

export default Modal; 