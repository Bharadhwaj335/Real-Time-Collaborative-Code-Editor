/** Holds the Socket.IO server for HTTP controllers (e.g. room delete broadcast). */
let ioRef = null;

export const setSocketIo = (io) => {
  ioRef = io;
};

export const getSocketIo = () => ioRef;
