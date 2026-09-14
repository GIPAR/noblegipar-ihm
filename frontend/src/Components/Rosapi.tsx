import { useStore } from 'zustand';

import { ROStore } from '../contexts/Store';
import './Rosapi.css'

export const RosapiMenu = () => {
    const ros = useStore(ROStore, (s) => s.ros)
    const Data = useStore(ROStore, (s) => s.rosapiData)

    return (
        <div className='rosapi'>
            <div className='rosapi-options'>
                <div className='rosapi-options-button' onClick={() => ros.callrosapi("topics")}>Tópicos</div>
                <div className='rosapi-options-button' onClick={() => ros.callrosapi("services")}>Serviços</div>
                <div className='rosapi-options-button' onClick={() => ros.callrosapi("nodes")}>Nós</div>
            </div>

            <div className='rosapi-data'>
                {Object.entries(Data).map(([key, content]) => (
                    <div key={key} style={{ marginBottom: '1rem' }}>
                        <strong style={{ display: 'block', borderBottom: '1px solid #a4ddc6' }}>
                            {key.toUpperCase()}
                        </strong>
      
                        {/* 2 CASES: Array vs Single Content check */}
                        {Array.isArray(content) ? (
                            content.map((item, index) => (
                                <div key={`${key}-${index}`} style={{ marginBottom: '0.8rem' }} >{String(item)}</div>
                            ))
                        ) : (
                        <div>{String(content)}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}