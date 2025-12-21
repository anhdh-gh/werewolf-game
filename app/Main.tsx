import './global.css'

export default function Home() {
  var xepLoaiHocLuc = function(diem){
   if(diem < 6){
    return "hoc sinh ngu";
   }else if( diem > 6 &&  6 < 8){
    return "hoc sinh kha";
   }
   else if(diem > 8){
    return"hoc sinh gioi";
   }
  }
  return (
    <>
    <p>dat:{xepLoaiHocLuc(9)}</p>
    <p>quynh:{xepLoaiHocLuc(7)}</p>
    <p>hien:{xepLoaiHocLuc(3)}</p>
  </>
  )
}
