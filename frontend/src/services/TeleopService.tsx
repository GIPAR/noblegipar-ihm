import { useEffect, useState, useRef, useCallback } from 'react'
import { useStore } from 'zustand'
import { ROStore } from '../contexts/Store';
import { useAtomValue, useSetAtom } from 'jotai';
import { LogAtom, SpeedLimitAtom, ShowTeleopAtom } from '../contexts/Molecule';
import '../Components/Teleop.css';

export const Teleoperation = () => {
    const baseRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);
    const valueRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);

    const baseRectRef = useRef<DOMRect | null>(null);
    const centerXRef = useRef(0);
    const centerYRef = useRef(0);
    const lastPublishRef = useRef({ linear: 0, angular: 0 });
    const publishRef = useRef({ n: 0, max: 5 });

    const [linear, setlinear] = useState(0);
    const [angular, setangular] = useState(0);
    const keysRef = useRef<Set<string>>(new Set());

    const ros = useStore(ROStore, (s) => s.ros)
    const isConnected = useStore(ROStore, (s) => s.isConnected)
    const MaxSpeed = useAtomValue(SpeedLimitAtom)
    const setLogData = useSetAtom(LogAtom)
    const setStartTeleop = useSetAtom(ShowTeleopAtom)


    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      const handleEl = handleRef.current;
      if (!baseRef.current || !handleEl) return;

      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      const rect = baseRef.current.getBoundingClientRect();
      baseRectRef.current = rect;
      centerXRef.current = rect.left + (rect.width / 2);
      centerYRef.current = rect.top + (rect.height / 2);
      
      isDraggingRef.current = true;

      //Instant Move after Clicking
      let deltaX = e.clientX - centerXRef.current;
      let deltaY = e.clientY - centerYRef.current;

      const maxRadius = (baseRectRef.current?.width ?? 150) / 2;
      const distance = Math.hypot(deltaX, deltaY);
      const clampRatio = 1 / maxRadius;

      if (distance > maxRadius) {
        const scale = maxRadius / distance;
        deltaX *= scale;
        deltaY *= scale;
      }

      handleEl.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

      valueRef.current = { x: Math.round(((deltaX * clampRatio) + Number.EPSILON) * 100) / 100, y: -Math.round(((deltaY * clampRatio) + Number.EPSILON) * 100) / 100 };
    }, []);


    const handlePointerMove = useCallback((e: React.PointerEvent) => {
      const handleEl = handleRef.current;
      if (!isDraggingRef.current || !baseRef.current || !handleEl) return;
      
      let deltaX = e.clientX - centerXRef.current;
      let deltaY = e.clientY - centerYRef.current;

      const maxRadius = (baseRectRef.current?.width ?? 150) / 2;
      const distance = Math.hypot(deltaX, deltaY);
      const clampRatio = 1 / maxRadius;

      if (distance > maxRadius) {
        const scale = maxRadius / distance;
        deltaX *= scale;
        deltaY *= scale;
      }

      handleEl.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

      valueRef.current = { x: Math.round(((deltaX * clampRatio) + Number.EPSILON) * 100) / 100, y: -Math.round(((deltaY * clampRatio) + Number.EPSILON) * 100) / 100 };
    }, []);


    const handlePointerUp = useCallback((e: React.PointerEvent) => {
      const handleEl = handleRef.current;
      if (!isDraggingRef.current || !handleEl) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch { /* Verificar se é realmente seguro ignorar esta parte */ }
      
      isDraggingRef.current = false;

      handleEl.style.transform = 'translate(-50%, -50%)';
      valueRef.current = { x: 0, y: 0 };
    }, []);

    // useEffect(() => {
    //   if(isConnected == false){
    //     setStartTeleop(false);
    //     return;
    //   }
      

    //   if( ros.advertise('/noblenara/alfa/cmd_vel', 'geometry_msgs/Twist', 'best_effort', 'volatile', 1) === false){
    //     setLogData({msg: "Impossível de manejar o tópico!", id: Date.now(), error: true});
    //     setStartTeleop(false);
    //     return;
    //    }

    //   return () => {
    //     ros.unadvertise('/noblenara/alfa/cmd_vel')
    //   };
    // }, [])

    useEffect(() => {
      if(isConnected == false){
        setLogData({msg: "Não há conexão com o ROS!", id: Date.now(), error: true});
        setStartTeleop(false);
        return;
      }

      const HandleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
      const HandleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());

      window.addEventListener('keydown', HandleKeyDown);
      window.addEventListener('keyup', HandleKeyUp);

      const PeriodicPublisher = setInterval(() => {
        let velocity = { linear: 0, angular: 0};
        const keys = keysRef.current;

        if(keys.has(' ')){ 
          ros.stopRobot(); 
        }
        else if(valueRef.current.x !== 0 || valueRef.current.y !== 0){
          velocity.linear = valueRef.current.y * MaxSpeed.linear;
          velocity.angular = -valueRef.current.x * MaxSpeed.angular;
        }
        else{
          if(keys.has('w')){velocity.linear = MaxSpeed.linear}
          if(keys.has('a')){velocity.angular = MaxSpeed.angular}
          if(keys.has('s')){velocity.linear = -MaxSpeed.linear}
          if(keys.has('d')){velocity.angular = -MaxSpeed.angular}
        }

        if(velocity.linear === 0 && velocity.angular === 0){
          publishRef.current.n = publishRef.current.n + 1; 
        }
        else{
          publishRef.current.n = 0;
        }

        if(publishRef.current.n < publishRef.current.max){
          ros.publishVelocity(velocity.linear, velocity.angular);
          lastPublishRef.current = {linear: velocity.linear, angular: velocity.angular};
        }

        setlinear(prev => (prev !== velocity.linear ? velocity.linear : prev));
        setangular(prev => (prev !== velocity.angular ? velocity.angular : prev));
      }, 100);

      return () => {
        window.removeEventListener('keydown', HandleKeyDown);
        window.removeEventListener('keyup', HandleKeyUp);
        ros.stopRobot();
        clearInterval(PeriodicPublisher);
      };
    },[isConnected, setLogData, MaxSpeed, ros, setStartTeleop]);


    return (
      <div className='Teleop'>
        <div className='Control'>
          <div className='Control-info'> L: {linear} | A: {angular} </div>
          <div className='Control-tutorial'> Use 'w, a, s, d' para mover </div>
          <div className='Control-tutorial'> Pressione 'Espaço' para parar </div>
        </div>

        <div className={`Joystick-base`} ref={baseRef} 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onLostPointerCapture={handlePointerUp}>

          <div className="Joystick-handle" ref={handleRef}/>
        
        </div>

      </div>
    )
}