import { SwitchCode } from './SwitchCode';
import { useStore } from 'zustand';
import { GlobalStore, ROStore } from '../../contexts/Store';
import { useAtom } from 'jotai'
import { DashboardAtom, BatteryAtom, ShowTeleopAtom, ShowRosapiAtom, ShowMapAtom, ShowBatteryAtom } from '../../contexts/Molecule';
import { useState } from 'react';
import { Teleoperation } from '../../services/TeleopService';
import { BatteryView } from '../Battery';
import './Dashboard.css'

export const Dashboard = () => {
    const [isFull, setisFull] = useState(false)
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const isConnected = useStore(ROStore, (s) => s.isConnected)
    const userConfig = useStore(GlobalStore, (s) => s.userConfig)
    const [Selection, setSelection] = useAtom(DashboardAtom)
    const [StartTeleop] = useAtom(ShowTeleopAtom)
    const [ShowRosapi] = useAtom(ShowRosapiAtom)
    const [ShowMap] = useAtom(ShowMapAtom)
    const [isExpanded] = useAtom(BatteryAtom)
    const [ShowBattery] = useAtom(ShowBatteryAtom)

    // Develop: Ver se á outra maneira para selecionar se vai mudar o "main" ou o "firstside", tentei guardar uma string e jogar dentro do set mas não funcionou, porém talvez errei a sintaxe

    const HandleReload = async (auxiliar: number, which: number) => {
        if(which === 1){
            setSelection({ ...Selection, main: 0 });
            await sleep(30);
            setSelection({ ...Selection, main: auxiliar })
        }
        else if(which === 2){
            setSelection({ ...Selection, firstside: 0 });
            await sleep(30);
            setSelection({ ...Selection, firstside: auxiliar })
        }
    }

    return (
        <div className='Dashboard' style={{ '--side-grid' : isFull ? '0fr' : '1fr'} as React.CSSProperties}>

            <div className='Dashboard-main'>
                <SwitchCode which={Selection.main}/>
                <div className='Dashboard-icon select'
                    onClick={() => { setisFull(!isFull) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="#38bd9c" viewBox="0 0 256 256"><path d="M216,48V96a8,8,0,0,1-16,0V67.31l-42.34,42.35a8,8,0,0,1-11.32-11.32L188.69,56H160a8,8,0,0,1,0-16h48A8,8,0,0,1,216,48ZM98.34,146.34,56,188.69V160a8,8,0,0,0-16,0v48a8,8,0,0,0,8,8H96a8,8,0,0,0,0-16H67.31l42.35-42.34a8,8,0,0,0-11.32-11.32ZM208,152a8,8,0,0,0-8,8v28.69l-42.34-42.35a8,8,0,0,0-11.32,11.32L188.69,200H160a8,8,0,0,0,0,16h48a8,8,0,0,0,8-8V160A8,8,0,0,0,208,152ZM67.31,56H96a8,8,0,0,0,0-16H48a8,8,0,0,0-8,8V96a8,8,0,0,0,16,0V67.31l42.34,42.35a8,8,0,0,0,11.32-11.32Z"></path></svg>
                </div>

                <div className='Dashboard-icon reload'
                    onClick={() => { {HandleReload(Selection.main, 1)} }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="#38bd9c" viewBox="0 0 256 256"><path d="M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,0,1,11-11.63A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L44.59,96H72a8,8,0,0,1,0,16H24a8,8,0,0,1-8-8V56a8,8,0,0,1,16,0V85.8L60.25,60A96,96,0,0,1,224,128Z"></path></svg>
                </div>

                {StartTeleop ? <Teleoperation/> : null}
            </div>

            <div className='Dashboard-side'>
                <div className={`Dashboard-side-status ${isExpanded ? 'Increase' : null}`}>
                    {ShowBattery === true ? <BatteryView/> : <h3> {isConnected ? (<span style={{ color: 'rgb(20, 202, 102)' }}>Bridge: Conectada</span>): (<span style={{ color: 'rgb(85, 190, 168)' }}>Bridge: Desconectada</span>)}</h3>}
                </div>

                <div className='Dashboard-side-container'>
                    <SwitchCode which={Selection.firstside}/>
                    <div className='Dashboard-icon select'
                        onClick={() => {
                            if(Selection.main === 1){setSelection({main: 2, firstside: 1} )}
                            else if(Selection.main === 2){setSelection({main: 1, firstside: 2} )} }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#26ac8f" viewBox="0 0 256 256"><path d="M213.66,181.66l-32,32a8,8,0,0,1-11.32-11.32L188.69,184H48a8,8,0,0,1,0-16H188.69l-18.35-18.34a8,8,0,0,1,11.32-11.32l32,32A8,8,0,0,1,213.66,181.66Zm-139.32-64a8,8,0,0,0,11.32-11.32L67.31,88H208a8,8,0,0,0,0-16H67.31L85.66,53.66A8,8,0,0,0,74.34,42.34l-32,32a8,8,0,0,0,0,11.32Z"></path></svg>
                    </div>

                    <div className='Dashboard-icon reload'
                        onClick={() => { {HandleReload(Selection.firstside, 2)} }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="#38bd9c" viewBox="0 0 256 256"><path d="M224,128a96,96,0,0,1-94.71,96H128A95.38,95.38,0,0,1,62.1,197.8a8,8,0,0,1,11-11.63A80,80,0,1,0,71.43,71.39a3.07,3.07,0,0,1-.26.25L44.59,96H72a8,8,0,0,1,0,16H24a8,8,0,0,1-8-8V56a8,8,0,0,1,16,0V85.8L60.25,60A96,96,0,0,1,224,128Z"></path></svg>
                    </div>
                </div>
                
                {ShowRosapi === true ? <div className='Dashboard-side-container'> <SwitchCode which={3}/> </div> : null}

                {ShowMap === true && userConfig.isAdmin === true ?
                <div className='Dashboard-side-container'>
                    <SwitchCode which={4}/>
                </div>
                : null}
            </div>

        </div>
    );
}