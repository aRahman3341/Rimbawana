import { IDENTITAS } from '@/lib/konten'
export default function PublikFooter() {
  return (
    <footer className="footer">
      <div className="dalam">
        <div><b>{IDENTITAS.lengkap}</b><br />{IDENTITAS.kampus}<br />{IDENTITAS.alamat}</div>
        <div><b>Hubungi kami</b><br /><a href={`mailto:${IDENTITAS.email}`}>{IDENTITAS.email}</a>
          {IDENTITAS.sosial.map(s => <div key={s.url}><a href={s.url}><i className={`bi bi-${s.ikon}`} /> {s.nama}</a></div>)}</div>
      </div>
      <div className="hak">&copy; {new Date().getFullYear()} {IDENTITAS.lengkap}</div>
    </footer>)
}
