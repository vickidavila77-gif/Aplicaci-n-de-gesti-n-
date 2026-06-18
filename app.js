// ===========================================
// GESTOR DE PRÉSTAMOS - app.js
// ===========================================

var STORAGE_KEY = 'prestamos';

var SAMPLE_LOANS = [
    { id: 'L-1001', empleado: 'Sarah Jenkins', departamento: 'Marketing', equipo: '🖱️ Mouse', idActivo: 'EQ-502', serie: 'C4D19E5', fechaRegistro: '24/10/2023', fechaRetorno: '2023-10-31', estado: 'Activo' },
    { id: 'L-1002', empleado: 'Liam Chen', departamento: 'Marketing', equipo: '⌨️ Teclado', idActivo: 'EQ-511', serie: 'K7B82F1', fechaRegistro: '24/10/2023', fechaRetorno: '2023-10-28', estado: 'Activo' },
    { id: 'L-1003', empleado: 'Anya Sharma', departamento: 'Marketing', equipo: '🔌 Cargador', idActivo: 'EQ-502', serie: 'C4D19E5', fechaRegistro: '24/10/2023', fechaRetorno: '2023-10-23', estado: 'Vencido' },
    { id: 'L-1004', empleado: 'James Wilson', departamento: 'Marketing', equipo: '🖨️ Impresora', idActivo: 'EQ-502', serie: 'P9X23M4', fechaRegistro: '24/10/2023', fechaRetorno: '2023-10-23', estado: 'Vencido' },
    { id: 'L-1005', empleado: 'Emily Brown', departamento: 'Marketing', equipo: '💻 Laptop', idActivo: 'EQ-502', serie: 'L8N45V7', fechaRegistro: '24/10/2023', fechaRetorno: '2023-10-31', estado: 'Activo' }
];

var currentPage = 1;
var rowsPerPage = 10;
var searchTerm = '';

// ===========================================
// FUNCIONES DE ALMACENAMIENTO
// ===========================================

function getLoans() {
    var data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try { return JSON.parse(data); } catch(e) { return []; }
}

function saveLoans(loans) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loans));
}

function generateLoanId() {
    var loans = getLoans();
    if (loans.length === 0) return 'L-1001';
    var num = parseInt(loans[0].id.replace('L-', ''), 10) + 1;
    return 'L-' + num;
}

function generateAssetId() {
    return 'EQ-' + Math.floor(100 + Math.random() * 900);
}

// ===========================================
// FUNCIONES DE UTILIDAD
// ===========================================

function formatDate(iso) {
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
}

function isExpired(date) {
    var today = new Date();
    today.setHours(0,0,0,0);
    return new Date(date + 'T00:00:00') < today;
}

function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function esc(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

// ===========================================
// RENDERIZAR TABLA
// ===========================================

function renderLoans() {
    var allLoans = getLoans();

    // Actualizar estados
    var changed = false;
    for (var i = 0; i < allLoans.length; i++) {
        if (allLoans[i].estado === 'Activo' && isExpired(allLoans[i].fechaRetorno)) {
            allLoans[i].estado = 'Vencido';
            changed = true;
        }
    }
    if (changed) saveLoans(allLoans);

    // Filtrar
    var filtered = allLoans;
    if (searchTerm) {
        var t = searchTerm.toLowerCase();
        filtered = allLoans.filter(function(l) {
            return l.empleado.toLowerCase().indexOf(t) !== -1 ||
                   l.departamento.toLowerCase().indexOf(t) !== -1 ||
                   l.equipo.toLowerCase().indexOf(t) !== -1 ||
                   l.id.toLowerCase().indexOf(t) !== -1;
        });
    }

    // Paginación
    var totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * rowsPerPage;
    var page = filtered.slice(start, start + rowsPerPage);

    // Actualizar contadores
    document.getElementById('loanCount').textContent = allLoans.length;
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    document.getElementById('prevPage').disabled = (currentPage <= 1);
    document.getElementById('nextPage').disabled = (currentPage >= totalPages);

    // Mostrar/ocultar elementos
    var tableEl = document.getElementById('tableContainer');
    var cardsEl = document.getElementById('cardsMobile');
    var emptyEl = document.getElementById('emptyState');
    var pagEl = document.getElementById('pagination');

    if (allLoans.length === 0) {
        tableEl.style.display = 'none';
        cardsEl.innerHTML = '';
        emptyEl.style.display = 'block';
        pagEl.style.display = 'none';
        return;
    }

    emptyEl.style.display = 'none';
    pagEl.style.display = 'flex';

    // Renderizar tabla
    var html = '';
    for (var j = 0; j < page.length; j++) {
        var l = page[j];
        var exp = l.estado === 'Vencido';
        var rowCls = exp ? ' class="row--expired"' : '';
        var badgeCls = exp ? 'badge--expired' : 'badge--active';
        html += '<tr' + rowCls + ' data-loan-id="' + l.id + '">' +
            '<td><span class="badge ' + badgeCls + '">' + l.estado + '</span></td>' +
            '<td><strong>' + l.id + '</strong></td>' +
            '<td>' + l.fechaRegistro + '</td>' +
            '<td>' + esc(l.empleado) + ' / ' + esc(l.departamento) + '</td>' +
            '<td>' + l.equipo + '</td>' +
            '<td>' + l.idActivo + '</td>' +
            '<td>' + esc(l.serie) + '</td>' +
            '<td>' + formatDate(l.fechaRetorno) + '</td>' +
            '<td style="position:relative">' +
                '<button class="btn btn--primary btn-return" data-id="' + l.id + '">Marcar como Devuelto</button>' +
                '<div class="confirm-popup" id="popup-' + l.id + '" style="display:none">' +
                    '<p class="confirm-popup__text">¿Confirmar devolución de ' + esc(l.empleado) + ' ' + l.equipo + '?</p>' +
                    '<div class="confirm-popup__buttons">' +
                        '<button class="btn btn--primary btn-confirm" data-id="' + l.id + '">Confirmar Devolución</button>' +
                        '<button class="btn btn--secondary btn-cancel-popup">Cancelar</button>' +
                    '</div>' +
                '</div>' +
            '</td>' +
        '</tr>';
    }
    document.getElementById('loansTableBody').innerHTML = html;

    // Renderizar tarjetas móviles
    var cardsHtml = '';
    for (var k = 0; k < page.length; k++) {
        var m = page[k];
        var mexp = m.estado === 'Vencido';
        var mcls = mexp ? ' loan-card--expired' : '';
        var mbg = mexp ? 'badge--expired' : 'badge--active';
        cardsHtml += '<div class="loan-card' + mcls + '" data-loan-id="' + m.id + '">' +
            '<div class="loan-card__row"><span class="loan-card__label">Estado</span><span class="loan-card__value"><span class="badge ' + mbg + '">' + m.estado + '</span></span></div>' +
            '<div class="loan-card__row"><span class="loan-card__label">ID Préstamo</span><span class="loan-card__value"><strong>' + m.id + '</strong></span></div>' +
            '<div class="loan-card__row"><span class="loan-card__label">Fecha</span><span class="loan-card__value">' + m.fechaRegistro + '</span></div>' +
            '<div class="loan-card__row"><span class="loan-card__label">Empleado</span><span class="loan-card__value">' + esc(m.empleado) + ' / ' + esc(m.departamento) + '</span></div>' +
            '<div class="loan-card__row"><span class="loan-card__label">Tipo de Equipo</span><span class="loan-card__value">' + m.equipo + '</span></div>' +
            '<div class="loan-card__row"><span class="loan-card__label">ID Activo</span><span class="loan-card__value">' + m.idActivo + '</span></div>' +
            '<div class="loan-card__row"><span class="loan-card__label">Nº de Serie</span><span class="loan-card__value">' + esc(m.serie) + '</span></div>' +
            '<div class="loan-card__row"><span class="loan-card__label">Retorno Esperado</span><span class="loan-card__value">' + formatDate(m.fechaRetorno) + '</span></div>' +
            '<div class="loan-card__actions">' +
                '<button class="btn btn--primary btn-return" data-id="' + m.id + '">Marcar como Devuelto</button>' +
                '<div class="confirm-popup" id="popup-mobile-' + m.id + '" style="display:none">' +
                    '<p class="confirm-popup__text">¿Confirmar devolución de ' + esc(m.empleado) + ' ' + m.equipo + '?</p>' +
                    '<div class="confirm-popup__buttons">' +
                        '<button class="btn btn--primary btn-confirm" data-id="' + m.id + '">Confirmar Devolución</button>' +
                        '<button class="btn btn--secondary btn-cancel-popup">Cancelar</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }
    document.getElementById('cardsMobile').innerHTML = cardsHtml;

    // Adjuntar eventos a botones de devolución
    var returnBtns = document.querySelectorAll('.btn-return');
    for (var r = 0; r < returnBtns.length; r++) {
        returnBtns[r].onclick = function() {
            var id = this.getAttribute('data-id');
            // Cerrar todos los popups primero
            var pops = document.querySelectorAll('.confirm-popup');
            for (var p = 0; p < pops.length; p++) pops[p].style.display = 'none';
            // Abrir este popup
            var pop = document.getElementById('popup-' + id);
            if (!pop) pop = document.getElementById('popup-mobile-' + id);
            if (pop) pop.style.display = 'block';
        };
    }

    var confirmBtns = document.querySelectorAll('.btn-confirm');
    for (var c = 0; c < confirmBtns.length; c++) {
        confirmBtns[c].onclick = function() {
            var id = this.getAttribute('data-id');
            var loans = getLoans();
            var updated = [];
            for (var x = 0; x < loans.length; x++) {
                if (loans[x].id !== id) updated.push(loans[x]);
            }
            saveLoans(updated);
            renderLoans();
        };
    }

    var cancelBtns = document.querySelectorAll('.btn-cancel-popup');
    for (var b = 0; b < cancelBtns.length; b++) {
        cancelBtns[b].onclick = function() {
            var pops = document.querySelectorAll('.confirm-popup');
            for (var p = 0; p < pops.length; p++) pops[p].style.display = 'none';
        };
    }
}

// ===========================================
// INICIAR
// ===========================================

function init() {
    // Cargar datos de ejemplo si no hay nada
    if (getLoans().length === 0) {
        saveLoans(SAMPLE_LOANS);
    }

    // Obtener elementos
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    var menuBtn = document.getElementById('menuBtn');
    var modalOverlay = document.getElementById('modalOverlay');
    var addBtn = document.getElementById('addLoanBtn');
    var closeBtn = document.getElementById('closeModal');
    var cancelBtn = document.getElementById('cancelModal');
    var form = document.getElementById('loanForm');
    var searchInput = document.getElementById('searchInput');
    var rowsSelect = document.getElementById('rowsPerPage');
    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');

    // SIDEBAR
    menuBtn.onclick = function() {
        sidebar.classList.add('open');
        overlay.classList.add('visible');
    };

    overlay.onclick = function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('visible');
    };

    // MODAL - ABRIR
    addBtn.onclick = function() {
        modalOverlay.classList.add('open');
    };

    // MODAL - CERRAR con X
    closeBtn.onclick = function() {
        modalOverlay.classList.remove('open');
        form.reset();
        clearErrors();
    };

    // MODAL - CERRAR con Cancelar
    cancelBtn.onclick = function() {
        modalOverlay.classList.remove('open');
        form.reset();
        clearErrors();
    };

    // MODAL - CERRAR al hacer clic fuera
    modalOverlay.onclick = function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('open');
            form.reset();
            clearErrors();
        }
    };

    // CERRAR CON ESCAPE
    document.onkeydown = function(e) {
        if (e.key === 'Escape') {
            modalOverlay.classList.remove('open');
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
        }
    };

    // FORMULARIO - REGISTRAR
    form.onsubmit = function(e) {
        e.preventDefault();

        var empName = document.getElementById('empName');
        var dept = document.getElementById('department');
        var equip = document.getElementById('equipmentType');
        var serial = document.getElementById('serialNumber');
        var retDate = document.getElementById('returnDate');

        var valid = true;

        if (!empName.value.trim()) {
            document.getElementById('empNameError').textContent = '⚠️ El nombre del empleado es obligatorio';
            valid = false;
        }
        if (!dept.value.trim()) {
            document.getElementById('departmentError').textContent = '⚠️ El departamento es obligatorio';
            valid = false;
        }
        if (!equip.value) {
            document.getElementById('equipmentError').textContent = '⚠️ Selecciona un equipo';
            valid = false;
        }
        if (!serial.value.trim()) {
            document.getElementById('serialError').textContent = '⚠️ El número de serie es obligatorio';
            valid = false;
        }
        if (!retDate.value) {
            document.getElementById('returnDateError').textContent = '⚠️ La fecha de retorno es obligatoria';
            valid = false;
        }

        if (!valid) return;

        var loans = getLoans();
        loans.unshift({
            id: generateLoanId(),
            empleado: empName.value.trim(),
            departamento: dept.value.trim(),
            equipo: equip.value,
            idActivo: generateAssetId(),
            serie: serial.value.trim(),
            fechaRegistro: formatDate(todayISO()),
            fechaRetorno: retDate.value,
            estado: 'Activo'
        });
        saveLoans(loans);

        modalOverlay.classList.remove('open');
        form.reset();
        clearErrors();
        renderLoans();
    };

    // LIMPIAR ERRORES AL ESCRIBIR
    document.getElementById('empName').oninput = function() { document.getElementById('empNameError').textContent = ''; };
    document.getElementById('department').oninput = function() { document.getElementById('departmentError').textContent = ''; };
    document.getElementById('equipmentType').onchange = function() { document.getElementById('equipmentError').textContent = ''; };
    document.getElementById('serialNumber').oninput = function() { document.getElementById('serialError').textContent = ''; };
    document.getElementById('returnDate').onchange = function() { document.getElementById('returnDateError').textContent = ''; };

    // BÚSQUEDA
    searchInput.oninput = function() {
        searchTerm = this.value;
        currentPage = 1;
        renderLoans();
    };

    // PAGINACIÓN
    rowsSelect.onchange = function() {
        rowsPerPage = parseInt(this.value, 10);
        currentPage = 1;
        renderLoans();
    };

    prevBtn.onclick = function() {
        if (currentPage > 1) { currentPage--; renderLoans(); }
    };

    nextBtn.onclick = function() {
        var total = Math.ceil(getLoans().length / rowsPerPage);
        if (currentPage < total) { currentPage++; renderLoans(); }
    };

    // Render inicial
    renderLoans();
}

function clearErrors() {
    document.getElementById('empNameError').textContent = '';
    document.getElementById('departmentError').textContent = '';
    document.getElementById('equipmentError').textContent = '';
    document.getElementById('serialError').textContent = '';
    document.getElementById('returnDateError').textContent = '';
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
