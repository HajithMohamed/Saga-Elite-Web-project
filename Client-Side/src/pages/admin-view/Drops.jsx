import { Button } from '@/components/ui/button'
import { Sheet } from 'lucide-react';
import React, { Fragment, useState } from 'react'

const Drops = () => {
    const [openCreateDropDialog, setOpenCreateDialog]=useState(false);
  return (
    <Fragment>
        <div>
            <Button onClick={()=>setOpenCreateDialog(true)}>Add New Drop</Button>
        </div>
        <div>
            <Sheet open={openCreateDropDialog}
                onOpenChange={()=>{
                    setOpenCreateDialog(false)
                }}
            >
                <SheetContent >
                    <SheetHeader>
                        <SheetTitle>
                            Add New Drop
                        </SheetTitle>
                    </SheetHeader>
                    <div>
                        
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    </Fragment>
  )
}

export default Drops
