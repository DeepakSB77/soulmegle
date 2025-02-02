

const Modal = ({ onClose, children }) => {
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