let obras = [];
let obraActual = null;

async function cargarObras() {
    try {
        obras = await obtenerObras();
        actualizarGridObras();
    } catch (error) {
        console.error('Error al cargar obras:', error);
        mostrarError('Error al cargar las obras');
    }
}

function actualizarGridObras() {
    const container = document.getElementById('obras-grid');
    
    if (obras.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📖</div>
                <h3>Aún no tienes obras</h3>
                <p>Crea tu primera obra literaria para comenzar a gestionar personajes</p>
                <button onclick="abrirModalNuevaObra()" class="btn-primario">
                    + Crear Primera Obra
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = obras.map(obra => `
        <div class="tarjeta-obra" data-id="${obra.id}">
            <div class="tarjeta-obra-header">
                <h3>${escapeHTML(obra.titulo)}</h3>
                <span class="obra-genero">${obra.genero || 'Género no especificado'}</span>
            </div>
            ${obra.descripcion ? `<p class="obra-descripcion">${escapeHTML(obra.descripcion)}</p>` : ''}
            <div class="obra-stats">
                <span class="stat" onclick="cargarPersonajesDeObra(${obra.id})" style="cursor: pointer;">
                    👥 <span id="stats-${obra.id}">0</span> personajes
                </span>
            </div>
            <div class="tarjeta-obra-acciones">
                <button class="btn-icono" onclick="abrirModalEditarObra(${obra.id})" title="Editar obra">✏️</button>
                <button class="btn-icono" onclick="abrirModalEliminarObra(${obra.id})" title="Eliminar obra">🗑️</button>
                <button class="btn-primario btn-small" onclick="seleccionarObra(${obra.id})">
                    Gestionar Personajes
                </button>
            </div>
        </div>
    `).join('');
    
    // Actualizar contadores
    obras.forEach(obra => actualizarContadorPersonajes(obra.id));
}

async function actualizarContadorPersonajes(obraId) {
    try {
        const personajes = await obtenerPersonajesPorObra(obraId);
        const statElement = document.getElementById(`stats-${obraId}`);
        if (statElement) {
            statElement.textContent = personajes.length;
        }
    } catch (error) {
        console.error('Error al actualizar contador:', error);
    }
}

function abrirModalNuevaObra() {
    document.getElementById('modal-obra-titulo').textContent = 'Nueva Obra';
    document.getElementById('form-obra').reset();
    document.getElementById('obra-id').value = '';
    document.getElementById('modal-obra').style.display = 'block';
}

function abrirModalEditarObra(id) {
    const obra = obras.find(o => o.id === id);
    if (!obra) return;
    
    document.getElementById('modal-obra-titulo').textContent = 'Editar Obra';
    document.getElementById('obra-id').value = obra.id;
    document.getElementById('obra-titulo').value = obra.titulo;
    document.getElementById('obra-genero').value = obra.genero || '';
    document.getElementById('obra-descripcion').value = obra.descripcion || '';
    
    document.getElementById('modal-obra').style.display = 'block';
}

function cerrarModalObra() {
    document.getElementById('modal-obra').style.display = 'none';
}

async function seleccionarObra(id) {
    obraActual = obras.find(o => o.id === id);
    if (!obraActual) return;
    
    document.getElementById('titulo-obra-actual').textContent = obraActual.titulo;
    document.getElementById('personaje-obra-id').value = obraActual.id;
    
    await cargarPersonajesDeObra(obraActual.id);
    
    // Cambiar pantallas
    document.getElementById('pantalla-obras').classList.remove('pantalla-activa');
    document.getElementById('pantalla-obras').classList.add('pantalla-oculta');
    document.getElementById('pantalla-personajes').classList.remove('pantalla-oculta');
    document.getElementById('pantalla-personajes').classList.add('pantalla-activa');
}

function volverAObras() {
    document.getElementById('pantalla-personajes').classList.remove('pantalla-activa');
    document.getElementById('pantalla-personajes').classList.add('pantalla-oculta');
    document.getElementById('pantalla-obras').classList.remove('pantalla-oculta');
    document.getElementById('pantalla-obras').classList.add('pantalla-activa');
    obraActual = null;
    cargarObras();
}

// Event Listeners
document.getElementById('form-obra').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const obra = {
        id: document.getElementById('obra-id').value || null,
        titulo: document.getElementById('obra-titulo').value.trim(),
        genero: document.getElementById('obra-genero').value || null,
        descripcion: document.getElementById('obra-descripcion').value.trim() || null
    };
    
    if (!obra.titulo) {
        alert('El título es obligatorio');
        return;
    }
    
    try {
        await guardarObra(obra);
        cerrarModalObra();
        await cargarObras();
    } catch (error) {
        console.error('Error al guardar obra:', error);
        alert('Error al guardar la obra');
    }
});

document.getElementById('volver-obras').addEventListener('click', volverAObras);
document.getElementById('nueva-obra').addEventListener('click', abrirModalNuevaObra);
