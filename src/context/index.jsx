import React, { useContext, createContext } from 'react';
import { useAddress, useContract, useMetamask, useContractWrite } from '@thirdweb-dev/react';
import { ethers } from 'ethers';

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
    const { contract } = useContract('0x8e51A3290912E7bAd80D1200c261D9F80F87903F');
    const { mutateAsync : createCampaign } = useContractWrite(contract, 'createCampaign');

    const address = useAddress();
    const connect = useMetamask();

    const publishCampaign = async (form) => {
        try {
            const data = await createCampaign(
                [
                    address, 
                    form.title,
                    form.description,
                    form.target,
                    new Date(form.deadline).getTime(),
                    form.image
                ]
            );
            console.log('success ', data);
            
        } catch (error) {
            console.log('failure ', error);
        }
    }

    const getAllCampaigns = async () => {
        const campaigns = await contract.call('getAllCampaigns');
        const parsedCampaigns = campaigns.map((campaign, i) => ({
            owner: campaign.owner,
            title: campaign.title,
            description: campaign.description,
            target: ethers.utils.formatEther(campaign.target.toString()),
            amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
            deadline: campaign.deadline.toNumber(),
            image: campaign.imageURL,
            id: i
        }))

        return parsedCampaigns;
    }

    const getUserCampaigns = async () => {
        const allCampaigns = await getAllCampaigns();

        const userCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);

        return userCampaigns;
    }

    const donateToCampaign = async (id, amount) => {
        const data = await contract.call('donateToCampaign', id, { value: ethers.utils.parseEther(amount) });

        return data;
    }

    const getDonations = async (id) => {
        const donations = await contract.call('getDonators', id);

        const numberOfDonations = donations[0].length;

        const parsedDonations = [];

        for(let i=0 ; i<numberOfDonations ; i++){
            parsedDonations.push(
                {
                    donator: donations[0][i],
                    donation: ethers.utils.formatEther(donations[1][i].toString())
                }
            )
        }

        return parsedDonations;
    }

    return (
        <StateContext.Provider 
            value={{ 
                address,
                contract,
                connect,
                createCampaign: publishCampaign,
                getAllCampaigns,
                getUserCampaigns,
                donateToCampaign,
                getDonations
             }}>
             { children }
        </StateContext.Provider>
    )
}

export const useStateContext = () => useContext(StateContext);
