'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Building2, UserCircle2, Thermometer, ThermometerSun, Flame } from 'lucide-react';

export function LeadCard({ lead, attributes, listeners, setNodeRef, transform, isDragging }: any) {
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    const getTemperatureBadge = (temp: string) => {
        switch (temp) {
            case 'quente':
                return <Badge variant="default" className="bg-red-500 hover:bg-red-600 border-none"><Flame className="w-3 h-3 mr-1" /> Quente</Badge>;
            case 'morno':
                return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 border-none text-white"><ThermometerSun className="w-3 h-3 mr-1" /> Morno</Badge>;
            case 'frio':
            default:
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none"><Thermometer className="w-3 h-3 mr-1" /> Frio</Badge>;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`touch-none cursor-grab active:cursor-grabbing mb-3 `}
        >
            <Card className={`border-l-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${lead.temperature === 'quente' ? 'border-l-red-500' :
                    lead.temperature === 'morno' ? 'border-l-orange-500' : 'border-l-blue-500'
                }`}>
                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start mb-2">
                        {getTemperatureBadge(lead.temperature)}
                        <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            R$ {Number(lead.estimatedValue).toLocaleString('pt-BR')}
                        </span>
                    </div>
                    <CardTitle className="text-base flex items-center gap-2">
                        <UserCircle2 className="w-4 h-4 text-muted-foreground" />
                        {lead.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1">
                    {lead.company && (
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Building2 className="mr-2 h-3 w-3" />
                            {lead.company}
                        </div>
                    )}
                    {lead.phone && (
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Phone className="mr-2 h-3 w-3" />
                            {lead.phone}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
