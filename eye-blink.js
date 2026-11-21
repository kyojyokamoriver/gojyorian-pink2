import * as THREE from 'three';
import {modelConfig} from './model-config.js';

export function prepareBlink(model) {
  model.updateMatrixWorld(true);
  const eyes = modelConfig.eyes.map(name => model.getObjectByName(name)).filter(Boolean);
  const material = new THREE.MeshBasicMaterial({color:modelConfig.lidColor});
  const lids = modelConfig.eyeBoxes.map((box,i) => {
    const lo=box.min, hi=box.max, cx=(lo[0]+hi[0])/2, cy=(lo[1]+hi[1])/2;
    const w=hi[0]-lo[0], h=hi[1]-lo[1], z=hi[2]+w*.035;
    const lid=new THREE.Group();lid.name='closed-eye-'+i;
    const paths=[Array.from({length:25},(_,j)=>{
      const t=Math.PI*j/24;
      return new THREE.Vector3(cx-w*.40*Math.cos(t),cy+h*(.20-.45*Math.sin(t)),z);
    })];
    for (const x of [-.25,0,.25]) paths.push([
      new THREE.Vector3(cx+x*w,cy-h*.18,z),
      new THREE.Vector3(cx+x*w*1.3,cy-h*.43,z)
    ]);
    for(const path of paths) lid.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),path.length>2?48:4,w*.028,8,false),material));
    lid.visible=false;model.add(lid);return lid;
  });
  return {eyes,lids};
}
