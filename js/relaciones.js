let relacionesActuales = [];

async function cargarRelaciones(obraId) {
    try {
        relacionesActuales = await obtenerRelacionesPorObra(obraId);
    } catch (error) {
        console.error('Error al cargar relaciones:', error);
    }
}

function abrirArbolRelaciones() {
    if (!obraActual) return;
    
    document.getElementById('obra-arbol').textContent = obraActual.titulo;
    document.getElementById('relacion-obra-id').value = obraActual.id;
    
    // Cambiar a pantalla de árbol
    document.getElementById('pantalla-personajes').classList.remove('pantalla-activa');
    document.getElementById('pantalla-personajes').classList.add('pantalla-oculta');
    document.getElementById('pantalla-relaciones').classList.remove('pantalla-oculta');
    document.getElementById('pantalla-relaciones').classList.add('pantalla-activa');
    
    renderizarArbolGenealogico();
}

function volverAPersonajes() {
    document.getElementById('pantalla-relaciones').classList.remove('pantalla-activa');
    document.getElementById('pantalla-relaciones').classList.add('pantalla-oculta');
    document.getElementById('pantalla-personajes').classList.remove('pantalla-oculta');
    document.getElementById('pantalla-personajes').classList.add('pantalla-activa');
}

function renderizarArbolGenealogico() {
    const container = document.getElementById('arbol-genealogico');
    
    if (personajesActuales.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🌳</div>
                <h3>No hay personajes para mostrar</h3>
                <p>Crea personajes primero para ver el árbol de relaciones</p>
            </div>
        `;
        return;
    }
    
    // Crear un mapa de personajes por ID
    const mapaPersonajes = {};
    personajesActuales.forEach(p => mapaPersonajes[p.id] = p);
    
    // Crear estructura del árbol
    const arbol = construirArbolRelaciones(mapaPersonajes);
    
    // Renderizar con SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '600');
    svg.style.backgroundColor = '#f9f9f9';
    
    // Posicionar personajes en niveles
    const niveles = organizarPorNiveles(arbol);
    const posiciones = calcularPosiciones(niveles, mapaPersonajes);
    
    // Dibujar conexiones
    dibujarConexiones(svg, posiciones, relacionesActuales);
    
    // Dibujar nodos (personajes)
    dibujarNodos(svg, posiciones, mapaPersonajes);
    
    container.innerHTML = '';
    container.appendChild(svg);
}

function construirArbolRelaciones(mapaPersonajes) {
    const arbol = {
        raices: [],
        nodos: {}
    };
    
    // Identificar relaciones familiares
    personajesActuales.forEach(personaje => {
        arbol.nodos[personaje.id] = {
            id: personaje.id,
            padres: [],
            hijos: [],
            parejas: []
        };
    });
    
    relacionesActuales.forEach(rel => {
        const nodoOrigen = arbol.nodos[rel.personajeOrigen];
        const nodoDestino = arbol.nodos[rel.personajeDestino];
        
        if (!nodoOrigen || !nodoDestino) return;
        
        switch(rel.tipo) {
            case 'padre':
            case 'madre':
                nodoOrigen.hijos.push(rel.personajeDestino);
                nodoDestino.padres.push(rel.personajeOrigen);
                break;
            case 'hijo':
            case 'hija':
                nodoOrigen.padres.push(rel.personajeDestino);
                nodoDestino.hijos.push(rel.personajeOrigen);
                break;
            case 'esposo':
            case 'esposa':
                nodoOrigen.parejas.push(rel.personajeDestino);
                nodoDestino.parejas.push(rel.personajeOrigen);
                break;
        }
    });
    
    // Encontrar raíces (personajes sin padres)
    arbol.raices = personajesActuales
        .filter(p => !arbol.nodos[p.id].padres.length)
        .map(p => p.id);
    
    return arbol;
}

function organizarPorNiveles(arbol) {
    const niveles = {};
    const visitados = new Set();
    
    function asignarNivel(personajeId, nivel) {
        if (visitados.has(personajeId)) return;
        visitados.add(personajeId);
        
        if (!niveles[nivel]) niveles[nivel] = [];
        if (!niveles[nivel].includes(personajeId)) {
            niveles[nivel].push(personajeId);
        }
        
        // Procesar hijos
        arbol.nodos[personajeId].hijos.forEach(hijoId => {
            asignarNivel(hijoId, nivel + 1);
        });
    }
    
    arbol.raices.forEach(raiz => asignarNivel(raiz, 0));
    
    return niveles;
}

function calcularPosiciones(niveles, mapaPersonajes) {
    const posiciones = {};
    const anchoNivel = 200;
    const altoNivel = 100;
    const margen = 100;
    
    Object.keys(niveles).forEach(nivel => {
        const personajes = niveles[nivel];
        const total = personajes.length;
        const inicioX = (window.innerWidth - (total * anchoNivel)) / 2;
        
        personajes.forEach((personajeId, index) => {
            posiciones[personajeId] = {
                x: inicioX + (index * anchoNivel) + (anchoNivel / 2),
                y: margen + (parseInt(nivel) * altoNivel)
            };
        });
    });
    
    return posiciones;
}

function dibujarConexiones(svg, posiciones, relaciones) {
    relaciones.forEach(rel => {
        const origen = posiciones[rel.personajeOrigen];
        const destino = posiciones[rel.personajeDestino];
        
        if (!origen || !destino) return;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', origen.x);
        line.setAttribute('y1', origen.y);
        line.setAttribute('x2', destino.x);
        line.setAttribute('y2', destino.y);
        
        // Diferentes estilos según tipo de relación
        if (rel.tipo.includes('espos')) {
            line.setAttribute('stroke', '#FF6B6B');
            line.setAttribute('stroke-width', '3');
            line.setAttribute('stroke-dasharray', '5,5');
        } else if (rel.tipo.includes('padre') || rel.tipo.includes('madre') || 
                   rel.tipo.includes('hijo') || rel.tipo.includes('hija')) {
            line.setAttribute('stroke', '#4ECDC4');
            line.setAttribute('stroke-width', '2');
        } else {
            line.setAttribute('stroke', '#95A5A6');
            line.setAttribute('stroke-width', '1');
        }
        
        svg.appendChild(line);
    });
}

function dibujarNodos(svg, posiciones, mapaPersonajes) {
    Object.keys(posiciones).forEach(personajeId => {
        const pos = posiciones[personajeId];
        const personaje = mapaPersonajes[personajeId];
        
        // Círculo del personaje
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', pos.y);
        circle.setAttribute('r', '30');
        
        // Color según género
        let color = '#95A5A6';
        if (personaje.genero === 'masculino') {
            color = '#3498DB'; // Azul
        } else if (personaje.genero === 'femenino') {
            color = '#E83E8C'; // Rosado
        }
        
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', '#2C3E50');
        circle.setAttribute('stroke-width', '2');
        
        // Tooltip con nombre
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${personaje.nombre} (${personaje.rol})`;
        circle.appendChild(title);
        
        svg.appendChild(circle);
        
        // Nombre del personaje
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pos.x);
        text.setAttribute('y', pos.y + 45);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#2C3E50');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.textContent = personaje.nombre.length > 15 ? 
            personaje.nombre.substring(0, 12) + '...' : 
            personaje.nombre;
        
        svg.appendChild(text);
    });
}

function abrirModalNuevaRelacion() {
    if (!obraActual || personajesActuales.length < 2) {
        alert('Necesitas al menos 2 personajes para crear una relación');
        return;
    }
    
    const origenSelect = document.getElementById('personaje-origen');
    const destinoSelect = document.getElementById('personaje-destino');
    
    // Llenar selects
    origenSelect.innerHTML = '<option value="">Seleccionar personaje</option>';
    destinoSelect.innerHTML = '<option value="">Seleccionar personaje</option>';
    
    personajesActuales.forEach(p => {
        const option1 = document.createElement('option');
        option1.value = p.id;
        option1.textContent = p.nombre;
        origenSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = p.id;
        option2.textContent = p.nombre;
        destinoSelect.appendChild(option2);
    });
    
    document.getElementById('relacion-obra-id').value = obraActual.id;
    document.getElementById('modal-relacion').style.display = 'block';
}

function cerrarModalRelacion() {
    document.getElementById('modal-relacion').style.display = 'none';
}

// Event Listeners
document.getElementById('ver-relaciones').addEventListener('click', abrirArbolRelaciones);
document.getElementById('volver-personajes').addEventListener('click', volverAPersonajes);
document.getElementById('nueva-relacion').addEventListener('click', abrirModalNuevaRelacion);

document.getElementById('form-relacion').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const origen = parseInt(document.getElementById('personaje-origen').value);
    const destino = parseInt(document.getElementById('personaje-destino').value);
    const tipo = document.getElementById('tipo-relacion').value;
    const obraId = parseInt(document.getElementById('relacion-obra-id').value);
    
    if (origen === destino) {
        alert('Un personaje no puede relacionarse consigo mismo');
        return;
    }
    
    const relacion = {
        obraId,
        personajeOrigen: origen,
        personajeDestino: destino,
        tipo
    };
    
    try {
        await guardarRelacion(relacion);
        cerrarModalRelacion();
        await cargarRelaciones(obraId);
        renderizarArbolGenealogico();
    } catch (error) {
        alert(error.message || 'Error al crear la relación');
    }
});
