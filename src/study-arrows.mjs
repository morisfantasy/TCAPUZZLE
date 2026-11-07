// Board-space geometry, in squares. A single filled outline avoids seams at the tip
// and at the rounded elbow, including when annotations are drawn translucently.
function unit([x,y],[u,v]) {
  const length=Math.hypot(u-x,v-y);
  return [(u-x)/length,(v-y)/length];
}
function offset(point,vector,distance) {
  return [point[0]+vector[0]*distance,point[1]+vector[1]*distance];
}
function pair(point) {return point.map(n=>Number(n.toFixed(4))).join(' ');}
export function arrowRoute(a,b) {
  const dx=Math.abs(a[0]-b[0]), dy=Math.abs(a[1]-b[1]);
  if ((dx===2 && dy===1) || (dx===1 && dy===2)) return [a,dx===2?[b[0],a[1]]:[a[0],b[1]],b];
  return [a,b];
}
export function arrowOutline(route) {
  const start=route[0],tip=route.at(-1),first=unit(start,route[1]),last=unit(route.at(-2),tip);
  const normal=vector=>[-vector[1],vector[0]];
  const sideA=normal(first),sideB=normal(last),half=.062,wing=.192,depth=.32,radius=.23;
  const tail=offset(start,first,.16),neck=offset(tip,last,-depth);
  const atTail=side=>pair(offset(tail,sideA,half*side));
  const atHead=(along,across)=>pair(offset(offset(neck,last,along),sideB,across));
  function elbow(side,reverse) {
    if(route.length!==3)return '';
    const corner=route[1],width=side*half;
    const enter=offset(offset(corner,first,-radius),sideA,width);
    const leave=offset(offset(corner,last,radius),sideB,width);
    const control=offset(offset(corner,sideA,width),sideB,width);
    return ' L'+pair(reverse?leave:enter)+' Q'+pair(control)+' '+pair(reverse?enter:leave);
  }
  return 'M'+atTail(1)+elbow(1,false)+' L'+atHead(0,half)+' L'+atHead(-.022,wing-.025)+
    ' Q'+atHead(-.029,wing+.012)+' '+atHead(.012,wing-.006)+' L'+pair(tip)+
    ' L'+atHead(.012,-wing+.006)+' Q'+atHead(-.029,-wing-.012)+' '+atHead(-.022,-wing+.025)+
    ' L'+atHead(0,-half)+elbow(-1,true)+' L'+atTail(-1)+' A'+half+' '+half+' 0 0 0 '+atTail(1)+' Z';
}
export function nearArrow(point,route) {
  return route.slice(1).some(([x,y],i)=>{
    const [a,b]=route[i],dx=x-a,dy=y-b;
    const t=Math.max(0,Math.min(1,((point[0]-a)*dx+(point[1]-b)*dy)/(dx*dx+dy*dy)));
    return Math.hypot(point[0]-a-t*dx,point[1]-b-t*dy)<.23;
  });
}
