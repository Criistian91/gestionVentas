import { UsuarioSesion } from "./poo/modelos.js";

const inputUser = document.getElementById("inputUsuario");
const inputPass = document.getElementById("inputPassword");
const btnLogin = document.getElementById("btnLogin");

// Enter en password dispara login
if (inputPass) {
    inputPass.addEventListener("keyup", (e) => {
        if (e.key === "Enter") btnLogin.click();
    });
}

btnLogin.addEventListener("click", () => {
    const user = (inputUser.value || "").trim();
    const pass = (inputPass.value || "").trim();

    const sesion = new UsuarioSesion();

    if (!user || !pass) {
        alert("Completá usuario y contraseña.");
        return;
    }

    try {
        if (sesion.login(user, pass)) {
            sesion.registrarActividad();
            // Si venís de una página, podríamos ir a index
            location.href = "index.html";
        } else {
            alert("Usuario o contraseña incorrectos.");
        }
    } catch (e) {
        console.error(e);
        alert("Error en el proceso de login.");
    }
});
