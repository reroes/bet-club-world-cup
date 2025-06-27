'use strict';

document.addEventListener('DOMContentLoaded', async function () {
    // --- CONFIGURACIÓN DE FIREBASE ---
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0ouC6qbpqNtGdgii8Akwdo-zKOozVLSQ",
  authDomain: "derby-bet-mundial-clubs.firebaseapp.com",
  projectId: "derby-bet-mundial-clubs",
  storageBucket: "derby-bet-mundial-clubs.firebasestorage.app",
  messagingSenderId: "946168774643",
  appId: "1:946168774643:web:1f310f176e127739a21c86"
};

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // --- FUNCIÓN PRINCIPAL ASÍNCRONA ---
    // Envolvemos todo en una función 'async' para poder usar 'await'
    async function inicializarApp() {
        // 1. OBTENER EL GRUPO DE LA URL
        const urlParams = new URLSearchParams(window.location.search);
        const groupId = urlParams.get('grupo');

        if (!groupId) {
            mostrarError('No se ha especificado un grupo en la URL.');
            return;
        }

        // 2. VALIDAR EL GRUPO CONTRA LA LISTA MAESTRA EN FIREBASE
        try {
            const configDoc = await db.collection('system_config').doc('groups').get();
            if (!configDoc.exists || !configDoc.data().valid_names.includes(groupId)) {
                mostrarError(`El grupo "${groupId}" no es válido o no existe.`);
                return;
            }
        } catch (error) {
            console.error("Error al validar el grupo:", error);
            mostrarError("No se pudo verificar la lista de grupos. Intenta de nuevo.");
            return;
        }

        // 3. SI EL GRUPO ES VÁLIDO, CONTINUAR CARGANDO LA APP
        cargarComponentes(groupId);
        configurarListeners(groupId);
        // mostrarPronosticosEnTiempoReal(groupId);
    }

    // --- FUNCIONES AUXILIARES ---

    function mostrarError(mensaje) {
        document.body.innerHTML = `<h1>Error</h1><p>${mensaje}</p><p>Por favor, usa el enlace correcto proporcionado por el administrador.</p>`;
    }

    function cargarComponentes(groupId) {
        document.querySelector('h1').innerText += ` - Grupo: ${groupId}`;

        const partidos = [
        { teamA: "Palmeiras", teamB: "Botafogo" },
        { teamA: "Benfica", teamB: "Chelsea" },
        { teamA: "PSG", teamB: "Inter Miami" },
        { teamA: "Flamengo", teamB: "FC Bayern" },
        { teamA: "Inter de Milán", teamB: "Fluminense" },
        { teamA: "Manchester City", teamB: "Al Hilal" },
        { teamA: "Real Madrid", teamB: "Juventus" },
        { teamA: "Dortmound", teamB: "Monterrey" }
    ];

        const matchesContainer = document.getElementById('matches-container');
        partidos.forEach((partido, index) => {
            const matchHTML = `
                <div class="match">
                    <span class="team-name team-a">${partido.teamA}</span>
                    <input type="number" class="score" id="scoreA${index}" min="0" max="99">
                    <span class="vs">-</span>
                    <input type="number" class="score" id="scoreB${index}" min="0" max="99">
                    <span class="team-name team-b">${partido.teamB}</span>
                </div>
            `;
            matchesContainer.innerHTML += matchHTML;
        });
    }

    function configurarListeners(groupId) {
        const submitBtn = document.getElementById('submitBtn');
        const userNameInput = document.getElementById('userName');

        submitBtn.addEventListener('click', function () {
            const userName = userNameInput.value.trim();
            if (!userName) { alert('Por favor, escribe tu nombre.'); return; }

            const pronosticos = {
                usuario: userName,
                fecha: firebase.firestore.FieldValue.serverTimestamp(),
                predicciones: [],
                groupId: groupId,
                fase: "octavos-final" // cambiar en cada fase
            };

            let allScoresFilled = true;
            document.querySelectorAll('.match').forEach((match, index) => {
                const scoreA = document.getElementById(`scoreA${index}`).value;
                const scoreB = document.getElementById(`scoreB${index}`).value;
                if (scoreA === '' || scoreB === '') allScoresFilled = false;
                const teamA = match.querySelector('.team-a').innerText;
                const teamB = match.querySelector('.team-b').innerText;
                pronosticos.predicciones.push({ equipoA: teamA, golesA: scoreA, equipoB: teamB, golesB: scoreB });
            });

            if (!allScoresFilled) { alert('Debes rellenar todos los marcadores.'); return; }

            db.collection("pronosticos").add(pronosticos)
                .then(() => alert(`¡Pronósticos guardados para el GRUPO '${groupId}'!`))
                .catch((error) => console.error("Error al guardar: ", error));
        });
    }

    function mostrarPronosticosEnTiempoReal(groupId) {
        const resultsContainer = document.getElementById('results-container');
        db.collection("pronosticos")
            .where("groupId", "==", groupId)
            .orderBy("fecha", "desc")
            .onSnapshot((querySnapshot) => {
                resultsContainer.innerHTML = `<h2>Pronósticos de Participantes (Grupo: ${groupId}):</h2>`;
                if (querySnapshot.empty) {
                    resultsContainer.innerHTML += `<p>Nadie de este grupo ha enviado un pronóstico.</p>`;
                    return;
                }
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    let html = `<div class="prediction-card"><p class="user-name"><strong>${data.usuario}</strong></p><ul>`;
                    data.predicciones.forEach(p => {
                        html += `<li>${p.equipoA} <strong>${p.golesA || '0'} - ${p.golesB || '0'}</strong> ${p.equipoB}</li>`;
                    });
                    html += `</ul></div>`;
                    resultsContainer.innerHTML += html;
                });
            });
    }

    // --- INICIAR LA APLICACIÓN ---
    inicializarApp();
});
