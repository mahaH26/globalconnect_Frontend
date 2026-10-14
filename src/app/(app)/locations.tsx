import { Button, Card, ErrorText, Muted, Screen, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { createElement, useCallback, useEffect, useState } from "react";
import { Linking, Platform, Text, TextInput, View } from "react-native";

interface Point {
  id: string;
  user_id: string;
  name: string;
  department: string;
  work_date: string;
  status: string;
  check_in: string | null;
  check_out: string | null;
  lat: number;
  lng: number;
  distance_m: number | null;
  within_radius: boolean | null;
}
interface Office {
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  radius: number | null;
}
interface MapData {
  from: string;
  to: string;
  offices: Office[];
  points: Point[];
  missing_coordinates: number;
  total_records: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n: number) => String(n).padStart(2, "0");
const t = new Date();
const todayStr = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;

const inputStyle = {
  backgroundColor: colors.field,
  borderRadius: 10,
  padding: 12,
  color: colors.text,
} as const;

function buildHtml(data: MapData) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>html,body,#m{height:100%;margin:0}</style></head><body><div id="m"></div>
<script>
var d=${json};
var map=L.map('m').setView([26.07,50.55],11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var b=[];
d.offices.forEach(function(o){
  L.marker([o.lat,o.lng]).addTo(map).bindPopup('<b>'+esc(o.name)+'</b><br>'+esc(o.address||'')+'<br>Allowed radius: '+(o.radius==null?'-':o.radius+' m'));
  if(o.radius) L.circle([o.lat,o.lng],{radius:o.radius,color:'#232A5C',fillOpacity:0.08}).addTo(map);
  b.push([o.lat,o.lng]);
});
d.points.forEach(function(p){
  var color=p.within_radius===false?'#D92D20':(p.status==='late'?'#D98200':'#12A150');
  L.circleMarker([p.lat,p.lng],{radius:9,color:'#fff',weight:2,fillColor:color,fillOpacity:1}).addTo(map)
   .bindPopup('<b>'+esc(p.name)+'</b><br>'+esc(p.department)+'<br>Date: '+esc(p.work_date)+
     '<br>Status: '+esc(p.status)+
     '<br>In: '+(p.check_in||'--:--')+' &nbsp; Out: '+(p.check_out||'--:--')+
     '<br>Distance from office: '+(p.distance_m==null?'-':p.distance_m+' m')+
     '<br><a target="_blank" href="https://www.google.com/maps?q='+p.lat+','+p.lng+'">Open in Google Maps</a>');
  b.push([p.lat,p.lng]);
});
if(b.length) map.fitBounds(b,{padding:[40,40],maxZoom:17});
</script></body></html>`;
}

export default function LocationsScreen() {
  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const f = from.trim();
    const e = to.trim();
    if (!DATE_RE.test(f) || !DATE_RE.test(e))
      return setError("Use the format YYYY-MM-DD for both dates.");
    if (e < f)
      return setError("The end date must not be before the start date.");
    setLoading(true);
    setError(null);
    try {
      setData(await api<MapData>(`/locations/map?from=${f}&to=${e}`));
    } catch (err: any) {
      setData(null);
      setError(err?.message ?? "Could not load locations");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen onRefresh={load} refreshing={false}>
      <Title>Employee locations</Title>

      <Card>
        <Text style={{ fontWeight: "700", color: colors.muted, fontSize: 13 }}>
          Start date
        </Text>
        <TextInput
          value={from}
          onChangeText={setFrom}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          style={inputStyle}
        />
        <Text style={{ fontWeight: "700", color: colors.muted, fontSize: 13 }}>
          End date
        </Text>
        <TextInput
          value={to}
          onChangeText={setTo}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          style={inputStyle}
        />
        <ErrorText>{error}</ErrorText>
        <Button title="Show on map" onPress={load} loading={loading} />
      </Card>

      {data ? (
        <>
          <Muted>
            {data.points.length} of {data.total_records} check-in(s) shown on
            the map. Green = on time, orange = late, red = outside the allowed
            radius.
          </Muted>
          {data.total_records > 0 && data.points.length === 0 ? (
            <ErrorText>
              These records have no coordinates. Records added directly in the
              database (test data) have none. Real check-ins from the app are
              saved with their location.
            </ErrorText>
          ) : null}

          {Platform.OS === "web" ? (
            <View style={{ height: 480, borderRadius: 12, overflow: "hidden" }}>
              {createElement("iframe", {
                srcDoc: buildHtml(data),
                style: { width: "100%", height: "100%", border: 0 },
                title: "Employee locations map",
              })}
            </View>
          ) : (
            <Muted>The map is available in the web version.</Muted>
          )}

          <Card>
            <Text style={{ fontWeight: "800", color: colors.text }}>
              Check-ins
            </Text>
            {data.points.length === 0 ? (
              <Muted>No located check-ins for this period.</Muted>
            ) : null}
            {data.points.map((p) => (
              <View
                key={p.id}
                style={{
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  gap: 2,
                }}
              >
                <Text style={{ fontWeight: "700", color: colors.text }}>
                  {p.name}{" "}
                  <Text style={{ fontWeight: "400", color: colors.muted }}>
                    · {p.department}
                  </Text>
                </Text>
                <Muted>
                  {p.work_date} · {p.status} · In {p.check_in ?? "--:--"} · Out{" "}
                  {p.check_out ?? "--:--"} ·{" "}
                  {p.distance_m === null
                    ? "no office set"
                    : `${p.distance_m} m from office`}
                  {p.within_radius === false ? " · OUTSIDE RADIUS" : ""}
                </Muted>
                <Text
                  style={{ color: colors.primary, fontWeight: "700" }}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps?q=${p.lat},${p.lng}`,
                    )
                  }
                >
                  Open in Google Maps
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
