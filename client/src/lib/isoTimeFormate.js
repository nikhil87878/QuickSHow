const isoTimeFormate = (dateString) => {
    const date = new Date(dateString);
   const localTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    return localTime;
}   

export { isoTimeFormate };