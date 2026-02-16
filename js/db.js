const DB_NAME = 'GestorPersonajesDB';
const DB_VERSION = 2; // Incrementamos versión por nuevos stores
const STORES = {
    OBRAS: 'obras',
    PERSONAJES: 'personajes',
    RELACIONES: 'relaciones'
};

let db = null;

function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Store de obras
            if (!db.objectStoreNames.contains(STORES.OBRAS)) {
                const obraStore = db.createObjectStore(STORES.OBRAS, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                obraStore.createIndex('titulo', 'titulo', { unique: false });
            }
            
            // Store de personajes (actualizado)
            if (!db.objectStoreNames.contains(STORES.PERSONAJES)) {
                const personajeStore = db.createObjectStore(STORES.PERSONAJES, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                personajeStore.createIndex('obraId', 'obraId', { unique: false });
                personajeStore.createIndex('nombre', 'nombre', { unique: false });
                personajeStore.createIndex('genero', 'genero', { unique: false });
            } else {
                // Si ya existe, asegurar que tenga el índice de género
                const transaction = event.target.transaction;
                const personajeStore = transaction.objectStore(STORES.PERSONAJES);
                if (!personajeStore.indexNames.contains('genero')) {
                    personajeStore.createIndex('genero', 'genero', { unique: false });
                }
            }
            
            // Nuevo store de relaciones
            if (!db.objectStoreNames.contains(STORES.RELACIONES)) {
                const relacionStore = db.createObjectStore(STORES.RELACIONES, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                relacionStore.createIndex('obraId', 'obraId', { unique: false });
                relacionStore.createIndex('personajeOrigen', 'personajeOrigen', { unique: false });
                relacionStore.createIndex('personajeDestino', 'personajeDestino', { unique: false });
            }
        };
    });
}

// Funciones para Obras
async function obtenerObras() {
    await asegurarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.OBRAS], 'readonly');
        const store = transaction.objectStore(STORES.OBRAS);
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function guardarObra(obra) {
    await asegurarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.OBRAS], 'readwrite');
        const store = transaction.objectStore(STORES.OBRAS);
        
        if (!obra.id) {
            delete obra.id;
            obra.fechaCreacion = new Date().toISOString();
        }
        obra.fechaActualizacion = new Date().toISOString();
        
        const request = obra.id ? store.put(obra) : store.add(obra);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function eliminarObra(id) {
    await asegurarDB();
    const transaction = db.transaction([STORES.OBRAS, STORES.PERSONAJES, STORES.RELACIONES], 'readwrite');
    
    // Eliminar obra
    const obraStore = transaction.objectStore(STORES.OBRAS);
    obraStore.delete(id);
    
    // Eliminar personajes de la obra
    const personajeStore = transaction.objectStore(STORES.PERSONAJES);
    const personajesIndex = personajeStore.index('obraId');
    const personajesRequest = personajesIndex.getAll(id);
    
    personajesRequest.onsuccess = () => {
        personajesRequest.result.forEach(personaje => {
            personajeStore.delete(personaje.id);
        });
    };
    
    // Eliminar relaciones de la obra
    const relacionStore = transaction.objectStore(STORES.RELACIONES);
    const relacionesIndex = relacionStore.index('obraId');
    const relacionesRequest = relacionesIndex.getAll(id);
    
    relacionesRequest.onsuccess = () => {
        relacionesRequest.result.forEach(relacion => {
            relacionStore.delete(relacion.id);
        });
    };
    
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

// Funciones para Personajes (actualizadas)
async function obtenerPersonajesPorObra(obraId) {
    await asegurarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.PERSONAJES], 'readonly');
        const store = transaction.objectStore(STORES.PERSONAJES);
        const index = store.index('obraId');
        const request = index.getAll(obraId);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function guardarPersonaje(personaje) {
    await asegurarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.PERSONAJES], 'readwrite');
        const store = transaction.objectStore(STORES.PERSONAJES);
        
        if (!personaje.id) {
            delete personaje.id;
            personaje.fechaCreacion = new Date().toISOString();
        }
        personaje.fechaActualizacion = new Date().toISOString();
        
        const request = personaje.id ? store.put(personaje) : store.add(personaje);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function eliminarPersonaje(id) {
    await asegurarDB();
    const transaction = db.transaction([STORES.PERSONAJES, STORES.RELACIONES], 'readwrite');
    
    // Eliminar personaje
    const personajeStore = transaction.objectStore(STORES.PERSONAJES);
    personajeStore.delete(id);
    
    // Eliminar relaciones donde participa el personaje
    const relacionStore = transaction.objectStore(STORES.RELACIONES);
    const relacionesOrigen = relacionStore.index('personajeOrigen');
    const relacionesDestino = relacionStore.index('personajeDestino');
    
    const promesas = [];
    
    relacionesOrigen.getAll(id).onsuccess = (e) => {
        e.target.result.forEach(rel => relacionStore.delete(rel.id));
    };
    
    relacionesDestino.getAll(id).onsuccess = (e) => {
        e.target.result.forEach(rel => relacionStore.delete(rel.id));
    };
    
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

// Funciones para Relaciones
async function obtenerRelacionesPorObra(obraId) {
    await asegurarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.RELACIONES], 'readonly');
        const store = transaction.objectStore(STORES.RELACIONES);
        const index = store.index('obraId');
        const request = index.getAll(obraId);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function guardarRelacion(relacion) {
    await asegurarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.RELACIONES], 'readwrite');
        const store = transaction.objectStore(STORES.RELACIONES);
        
        // Evitar relaciones duplicadas
        const index = store.index('personajeOrigen');
        const request = index.getAll(relacion.personajeOrigen);
        
        request.onsuccess = () => {
            const existente = request.result.find(r => 
                r.personajeDestino === relacion.personajeDestino && 
                r.tipo === relacion.tipo
            );
            
            if (existente) {
                reject(new Error('Esta relación ya existe'));
                return;
            }
            
            if (!relacion.id) {
                delete relacion.id;
                relacion.fechaCreacion = new Date().toISOString();
            }
            
            const addRequest = store.add(relacion);
            addRequest.onerror = () => reject(addRequest.error);
            addRequest.onsuccess = () => resolve(addRequest.result);
        };
    });
}

async function eliminarRelacion(id) {
    await asegurarDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.RELACIONES], 'readwrite');
        const store = transaction.objectStore(STORES.RELACIONES);
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function asegurarDB() {
    if (!db) {
        await abrirDB();
    }
}
