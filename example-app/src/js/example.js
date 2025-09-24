import { MuxPlayer } from '@capgo/capacitor-mux-player';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    MuxPlayer.echo({ value: inputValue })
}
