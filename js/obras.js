async function guardarObra(obra) {
    await asegurarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.OBRAS], 'readwrite');
        const store = transaction.objectStore(STORES.OBRAS);
        
        // Si no tiene ID, es nueva
        if (!obra.id) {
            delete obra.id;
            obra.fechaCreacion = new Date().toISOString();
        }
        
        obra.fechaActualizacion = new Date().toISOString();
        
        let request;
        if (obra.id) {
            request = store.put(obra);
        } else {
            request = store.add(obra);
        }
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onerror = (event) => {
            reject(event.target.error);
        };
        
        transaction.oncomplete = () => {
            console.log('Transacción completada');
        };
        
        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}
