import { useCallback, useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

import { Ionicons } from "@expo/vector-icons";
import { Texto } from "@/components/texto";

import { formatarDistancia } from "@/utils/format";
import type { Coordenada, ResultadoBusca } from "@/types/models";

interface Props {
  dados: ResultadoBusca[];
  coordUsuario: Coordenada;
  onAbrir: (id: number) => void;
}

interface PinMapa {
  id: number;
  nome: string;
  dist: string;
  lat: number;
  lng: number;
}

function gerarHtml(pins: PinMapa[], uLat: number, uLng: number): string {
  // Serializa seguro p/ embutir em <script>: escapa <, >, & e separadores de linha
  // unicode — evita que um nome do CNES com "</script>" quebre/injete no documento.
  const pinsJson = JSON.stringify(pins)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body,#map{width:100%;height:100%;overflow:hidden}
.pn{background:#073b2e;color:#fff;border:2.5px solid #fff;border-radius:50%;
    width:32px;height:32px;display:flex;align-items:center;justify-content:center;
    font:700 13px/1 sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.pu{background:#F2683C;border:2.5px solid #fff;border-radius:50%;
    width:16px;height:16px;box-shadow:0 0 0 5px rgba(242,104,60,.2)}
.leaflet-popup-content{min-width:190px;font-family:sans-serif}
.pm-nome{font-size:14px;font-weight:700;color:#16241f;margin-bottom:3px}
.pm-dist{font-size:12px;color:#6b7c76;margin-bottom:10px}
.pm-btn{background:#0d6a51;color:#fff;border:none;border-radius:10px;
        padding:10px 0;font-size:13px;font-weight:700;width:100%;cursor:pointer}
</style>
</head>
<body>
<div id="map"></div>
<script>
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function verDetalhes(id){window.ReactNativeWebView.postMessage(JSON.stringify({id:id}))}
var pins=${pinsJson};
var map=L.map('map',{zoomControl:true});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
var ui=L.divIcon({className:'',html:'<div class="pu"></div>',iconSize:[16,16],iconAnchor:[8,8]});
L.marker([${uLat},${uLng}],{icon:ui}).addTo(map).bindPopup('<strong>Você está aqui</strong>');
var bounds=[[${uLat},${uLng}]];
pins.forEach(function(p,i){
  var ic=L.divIcon({className:'',html:'<div class="pn">'+(i+1)+'</div>',iconSize:[32,32],iconAnchor:[16,16]});
  L.marker([p.lat,p.lng],{icon:ic}).addTo(map)
   .bindPopup('<div class="pm-nome">'+esc(p.nome)+'</div><div class="pm-dist">'+esc(p.dist)+'</div><button class="pm-btn" onclick="verDetalhes('+p.id+')">Ver detalhes ›</button>');
  bounds.push([p.lat,p.lng]);
});
map.fitBounds(bounds,{padding:[40,40]});
<\/script>
</body>
</html>`;
}

export function MapaResultados({ dados, coordUsuario, onAbrir }: Props) {
  const pins = useMemo<PinMapa[]>(
    () =>
      dados
        .filter(
          (d): d is ResultadoBusca & { lat: number; lng: number } =>
            d.lat != null && d.lng != null
        )
        .map((d) => ({
          id: d.estabelecimento_id,
          nome: d.nome,
          dist: formatarDistancia(d.distancia_metros),
          lat: d.lat,
          lng: d.lng,
        })),
    [dados]
  );

  const html = useMemo(
    () => gerarHtml(pins, coordUsuario.lat, coordUsuario.lng),
    [pins, coordUsuario]
  );

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(e.nativeEvent.data) as { id: number };
        if (typeof payload.id === "number") onAbrir(payload.id);
      } catch {}
    },
    [onAbrir]
  );

  // WebView não roda no build web (expo export). Após os hooks (rules-of-hooks),
  // mostramos um fallback explicando que o mapa está no app móvel.
  if (Platform.OS === "web") {
    return (
      <View style={styles.webFallback}>
        <Ionicons name="map-outline" size={44} color="#6e7b74" />
        <Texto style={styles.webFallbackTexto}>
          O mapa está disponível no app instalado no celular.
        </Texto>
        <Texto style={styles.webFallbackSub}>
          Abra o Tem no SUS! no Android ou iOS para ver os serviços no mapa.
        </Texto>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        onMessage={onMessage}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 14,
  },
  webFallbackTexto: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16241f",
    textAlign: "center",
    lineHeight: 22,
  },
  webFallbackSub: {
    fontSize: 13,
    color: "#6e7b74",
    textAlign: "center",
    lineHeight: 19,
  },
});
