export const generateUniqueId = () => {
    function getRandomHex(size: number) {
      return Array.from({ length: size }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
  
    const uniqueId = `${getRandomHex(2)}-${getRandomHex(4)}-${getRandomHex(2)}-${getRandomHex(4)}`;
    
    return uniqueId;
}
