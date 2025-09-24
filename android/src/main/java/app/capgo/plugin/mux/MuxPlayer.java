package app.capgo.plugin.mux;

import com.getcapacitor.Logger;

public class MuxPlayer {

    public String echo(String value) {
        Logger.info("Echo", value);
        return value;
    }
}
