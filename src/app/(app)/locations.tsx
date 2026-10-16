import CalendarPicker from "@/components/CalendarPicker"; // adjust path if yours differs
import { Button, Card, ErrorText, Muted, Screen, Title } from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/theme";
import { createElement, useCallback, useEffect, useState } from "react";
import {
  Linking,
  Platform,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

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

// Bahrain is UTC+3 all year (same rule as CalendarPicker)
const todayStr = new Date(Date.now() + 3 * 3600 * 1000)
  .toISOString()
  .slice(0, 10);

const SOFT = "#5B6385";
const BREAKPOINT = 640;

const Label = ({ children }: { children: string }) => (
  <Text
    style={{ fontWeight: "600", color: SOFT, fontSize: 13, marginBottom: 6 }}
  >
    {children}
  </Text>
);

const Dot = ({ color, label }: { color: string; label: string }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
    <View
      style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }}
    />
    <Text style={{ color: SOFT, fontSize: 12 }}>{label}</Text>
  </View>
);

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
  const { width } = useWindowDimensions();
  const wide = width >= BREAKPOINT;

  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMap = useCallback(async (f: string, e: string) => {
    if (!f || !e || e < f)
      return setError(
        "Choose a start and end date. The end date can't be before the start date.",
      );
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
  }, []);

  const load = useCallback(() => fetchMap(from, to), [fetchMap, from, to]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeFrom = (v: string) => {
    setFrom(v);
    // keep the range valid: if start moves past end, move end with it
    if (v && to && v > to) setTo(v);
    setError(null);
  };

  const changeTo = (v: string) => {
    setTo(v);
    if (v && from && v < from) setFrom(v);
    setError(null);
  };

  return (
    <Screen onRefresh={load} refreshing={false}>
      <View
        style={{ width: "100%", maxWidth: 960, alignSelf: "center", gap: 16 }}
      >
        <Title>Employee locations</Title>

        <Card>
          <View style={{ gap: 20 }}>
            <View style={{ flexDirection: wide ? "row" : "column", gap: 16 }}>
              <View style={{ flex: wide ? 1 : undefined }}>
                <Label>Start date</Label>
                <CalendarPicker value={from} onChange={changeFrom} />
              </View>
              <View style={{ flex: wide ? 1 : undefined }}>
                <Label>End date</Label>
                <CalendarPicker value={to} onChange={changeTo} />
              </View>
            </View>

            {error ? <ErrorText>{error}</ErrorText> : null}

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 16,
                alignItems: wide ? "flex-start" : "stretch",
              }}
            >
              <Button
                style={wide ? { minWidth: 180 } : undefined}
                title="Show on map"
                onPress={load}
                loading={loading}
              />
            </View>
          </View>
        </Card>

        {data ? (
          <>
            <View style={{ gap: 8 }}>
              <Muted>
                {data.points.length} of {data.total_records} check-in
                {data.total_records === 1 ? "" : "s"} shown on the map.
              </Muted>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                <Dot color="#12A150" label="On time" />
                <Dot color="#D98200" label="Late" />
                <Dot color="#D92D20" label="Outside allowed radius" />
              </View>
            </View>

            {data.total_records > 0 && data.points.length === 0 ? (
              <ErrorText>
                These records have no coordinates. Records added directly in the
                database (test data) have none. Real check-ins from the app are
                saved with their location.
              </ErrorText>
            ) : null}

            {Platform.OS === "web" ? (
              <View
                style={{
                  height: wide ? 480 : 360,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
              >
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
              <View style={{ gap: 4 }}>
                <Text
                  style={{
                    fontWeight: "700",
                    color: colors.text,
                    fontSize: 16,
                  }}
                >
                  Check-ins
                </Text>
                {data.points.length === 0 ? (
                  <Muted>No located check-ins for this period.</Muted>
                ) : null}
                {data.points.map((p, i) => (
                  <View
                    key={p.id}
                    style={{
                      paddingVertical: 12,
                      borderTopWidth: i === 0 ? 0 : 1,
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
                      {p.work_date} · {p.status} · In {p.check_in ?? "--:--"} ·
                      Out {p.check_out ?? "--:--"} ·{" "}
                      {p.distance_m === null
                        ? "no office set"
                        : `${p.distance_m} m from office`}
                      {p.within_radius === false ? " · Outside radius" : ""}
                    </Muted>
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: "600",
                        fontSize: 13,
                        marginTop: 2,
                      }}
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
              </View>
            </Card>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
